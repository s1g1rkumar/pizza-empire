import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import { PoolConnection } from 'mysql2/promise';
import app from '../app';
import { ProductionProcessorService } from '../services/productionProcessor.service';
import {
  calculateProductionDurationSeconds,
  calculateProductionEfficiency,
} from '../utils/productionCalculator';

test('calculateProductionEfficiency and calculateProductionDurationSeconds scale accurately', () => {
  assert.equal(calculateProductionEfficiency([]), 1.0);
  assert.equal(calculateProductionEfficiency([1.0, 1.0]), 1.5);
  assert.equal(calculateProductionEfficiency([10, 10, 10]), 4.0);

  // 20s * 3 qty / 1.5x efficiency = 40s
  assert.equal(calculateProductionDurationSeconds(20, 3, 1.5), 40);
  // Clamped to 5s minimum
  assert.equal(calculateProductionDurationSeconds(5, 1, 4.0), 5);
});

test('ProductionProcessorService completes order once and prevents duplicate resource deposits', async () => {
  let orderStatus = 'IN_PROGRESS';
  let finishedPizzaQty = 0;
  let flourQty = 10;
  let flourReserved = 2;

  const mockConn = {
    async query(sql: string, params: unknown[] = []) {
      const norm = sql.trim().toUpperCase();
      if (norm.startsWith('SELECT ID') && norm.includes('FARM_PLOTS')) {
        return [[]];
      }
      if (norm.startsWith('SELECT') && norm.includes('FROM PRODUCTION_ORDERS')) {
        if (orderStatus === 'IN_PROGRESS') {
          return [
            [
              {
                id: 77,
                businessId: 2,
                recipeId: 10,
                batchMultiplier: 2,
                outputItemId: 50,
                outputQuantity: 1,
                recipeName: 'Classic Tomato Pizza',
              },
            ],
          ];
        }
        return [[]];
      }
      if (norm.startsWith('SELECT ITEM_ID AS ITEMID, QUANTITY_REQUIRED')) {
        return [[{ itemId: 5, quantityRequired: 1 }]];
      }
      if (norm.startsWith('SELECT ID, NAME, STORAGE_CAPACITY')) {
        return [[{ id: params[0], name: 'Mock Kitchen', storageCapacity: 500 }]];
      }
      if (norm.startsWith('SELECT QUANTITY, RESERVED_QUANTITY')) {
        const itemId = Number(params[1]);
        if (itemId === 5) return [[{ quantity: flourQty, reservedQuantity: flourReserved }]];
        return [[{ quantity: finishedPizzaQty, reservedQuantity: 0 }]];
      }
      if (norm.startsWith('UPDATE BUSINESS_INVENTORY')) {
        const itemId = Number(params[3]);
        if (itemId === 5) {
          flourQty = Number(params[0]);
          flourReserved = Number(params[1]);
        } else {
          finishedPizzaQty = Number(params[0]);
        }
        return [{ affectedRows: 1 }];
      }
      if (norm.startsWith('UPDATE PRODUCTION_ORDERS')) {
        orderStatus = 'COMPLETED';
        return [{ affectedRows: 1 }];
      }
      return [[]];
    },
  } as unknown as PoolConnection;

  const processor = new ProductionProcessorService();
  const firstRun = await processor.processCompletedProduction(mockConn, 1);
  assert.equal(firstRun.ordersCompleted, 1);
  assert.equal(flourQty, 8);
  assert.equal(flourReserved, 0);
  assert.equal(finishedPizzaQty, 2);

  // Second run must NOT complete the order again or duplicate pizzas
  const secondRun = await processor.processCompletedProduction(mockConn, 1);
  assert.equal(secondRun.ordersCompleted, 0);
  assert.equal(finishedPizzaQty, 2);
});

test('Production API endpoints enforce JWT authentication', async () => {
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1/production`;

  try {
    const getRes = await fetch(baseUrl);
    assert.equal(getRes.status, 401);

    const startRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeId: 1, quantity: 2 }),
    });
    assert.equal(startRes.status, 401);

    const cancelRes = await fetch(`${baseUrl}/orders/1/cancel`, { method: 'POST' });
    assert.equal(cancelRes.status, 401);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
