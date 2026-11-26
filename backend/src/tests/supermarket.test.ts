import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import app from '../app';
import {
  calculateSupermarketDemand,
  calculateSupermarketProfit,
  calculateSupermarketUpgradeCost,
  SUPERMARKET_BLUEPRINTS,
} from '../utils/supermarketCalculator';

async function withServer(run: (baseUrl: string) => Promise<void>): Promise<void> {
  const server = app.listen(0);
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }
}

test('SUPERMARKET_BLUEPRINTS, demand, upgrade cost, and profit calculators work accurately', () => {
  assert.equal(Object.keys(SUPERMARKET_BLUEPRINTS).length, 3);

  const zeroStockDemand = calculateSupermarketDemand({
    tier: 'SUPERMARKET',
    locationDemandMultiplier: 1.5,
    priceElasticity: 1.1,
    baseRetailPrice: 10,
    customPrice: 10,
    aisleLevel: 2,
    checkoutLanes: 4,
    coldStorageLevel: 2,
    decorLevel: 2,
    employeeProductivity: 1.5,
    availableStock: 0,
  });
  assert.equal(zeroStockDemand, 0);

  const stockedDemand = calculateSupermarketDemand({
    tier: 'SUPERMARKET',
    locationDemandMultiplier: 1.5,
    priceElasticity: 1.1,
    baseRetailPrice: 10,
    customPrice: 8,
    aisleLevel: 3,
    checkoutLanes: 4,
    coldStorageLevel: 2,
    decorLevel: 2,
    employeeProductivity: 2.0,
    availableStock: 200,
  });
  assert.ok(stockedDemand > 0 && stockedDemand <= 200);

  const lv1Cost = calculateSupermarketUpgradeCost('AISLES', 1);
  const lv2Cost = calculateSupermarketUpgradeCost('AISLES', 2);
  assert.ok(lv2Cost > lv1Cost);

  const profit = calculateSupermarketProfit({
    dailyRevenue: 3000,
    dailyCogs: 900,
    hourlyUpkeep: 30,
    employeeHourlyPayroll: 20,
  });
  assert.equal(profit.dailyExpenses, 2100);
  assert.equal(profit.netProfit, 900);
});

test('Supermarket API endpoints enforce JWT authentication', async () => {
  await withServer(async (baseUrl) => {
    const getRes = await fetch(`${baseUrl}/api/v1/supermarkets`);
    assert.equal(getRes.status, 401);

    const constructRes = await fetch(`${baseUrl}/api/v1/supermarkets/construct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Market', storeTier: 'MINI_MART', locationId: 1 }),
    });
    assert.equal(constructRes.status, 401);

    const supplyRes = await fetch(`${baseUrl}/api/v1/supermarkets/1/supply-from-factory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factoryId: 1, itemId: 1, quantity: 10 }),
    });
    assert.equal(supplyRes.status, 401);

    const salesRes = await fetch(`${baseUrl}/api/v1/supermarkets/1/sales/run`, {
      method: 'POST',
    });
    assert.equal(salesRes.status, 401);
  });
});
