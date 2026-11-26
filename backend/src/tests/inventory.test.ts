import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import { PoolConnection } from 'mysql2/promise';
import app from '../app';
import { InventoryService } from '../services/inventory.service';

/**
 * Simulates row-level FOR UPDATE locking in-memory so we can deterministically
 * test concurrent stock reservation/withdrawal race conditions without a live DB.
 */
function createLockedMockConnection(initialQty: number, initialReserved: number) {
  let quantity = initialQty;
  let reserved = initialReserved;
  let lockChain = Promise.resolve();
  const auditLogs: Array<{ type: string; qtyDelta: number; resDelta: number }> = [];

  const mockConn = {
    async query(sql: string, params: unknown[] = []) {
      const normalized = sql.trim().toUpperCase();

      if (normalized.startsWith('SELECT ID, NAME, STORAGE_CAPACITY')) {
        return [[{ id: params[0], name: 'Mock Farm', storageCapacity: 500 }]];
      }

      if (normalized.startsWith('SELECT QUANTITY, RESERVED_QUANTITY')) {
        // Acquire simulated FOR UPDATE row lock
        let release!: () => void;
        const nextLock = new Promise<void>((r) => {
          release = r;
        });
        const prev = lockChain;
        lockChain = prev.then(() => nextLock);
        await prev;
        (mockConn as { _release?: () => void })._release = release;
        return [[{ quantity, reservedQuantity: reserved }]];
      }

      if (normalized.startsWith('UPDATE BUSINESS_INVENTORY')) {
        quantity = Number(params[0]);
        reserved = Number(params[1]);
        (mockConn as { _release?: () => void })._release?.();
        return [{ affectedRows: 1 }];
      }

      if (normalized.startsWith('INSERT INTO INVENTORY_TRANSACTIONS')) {
        auditLogs.push({
          type: String(params[3]),
          qtyDelta: Number(params[4]),
          resDelta: Number(params[5]),
        });
        return [{ insertId: auditLogs.length }];
      }

      return [[]];
    },
  } as unknown as PoolConnection;

  return {
    mockConn,
    getState: () => ({ quantity, reserved, available: quantity - reserved }),
    getAuditLogs: () => auditLogs,
    releaseIfHeld: () => (mockConn as { _release?: () => void })._release?.(),
  };
}

test('Concurrent stock reservations serialize cleanly and prevent negative available stock', async () => {
  const service = new InventoryService();
  const sim = createLockedMockConnection(100, 0);

  // Two concurrent reservations of 60 units each against 100 available
  const results = await Promise.allSettled([
    service.reserveStock(sim.mockConn, 1, 10, 5, 60, 'order_1').finally(sim.releaseIfHeld),
    service.reserveStock(sim.mockConn, 1, 10, 5, 60, 'order_2').finally(sim.releaseIfHeld),
  ]);

  const fulfilled = results.filter((r) => r.status === 'fulfilled');
  const rejected = results.filter((r) => r.status === 'rejected');

  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  assert.deepEqual(sim.getState(), { quantity: 100, reserved: 60, available: 40 });
  assert.equal(sim.getAuditLogs().length, 1);
  assert.equal(sim.getAuditLogs()[0]?.type, 'RESERVE');

  // Release reserved stock on cancellation
  const released = await service.releaseReservedStock(sim.mockConn, 1, 10, 5, 60, 'order_1');
  assert.deepEqual(released, { quantity: 100, reservedQuantity: 0, availableQuantity: 100 });
  assert.equal(sim.getAuditLogs()[1]?.type, 'RELEASE');
});

test('Inventory API endpoints enforce JWT authentication', async () => {
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1/inventory`;

  try {
    const getRes = await fetch(baseUrl);
    assert.equal(getRes.status, 401);

    const buyRes = await fetch(`${baseUrl}/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: 1, itemId: 1, quantity: 5 }),
    });
    assert.equal(buyRes.status, 401);

    const transferRes = await fetch(`${baseUrl}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromBusinessId: 1, toBusinessId: 2, itemId: 1, quantity: 5 }),
    });
    assert.equal(transferRes.status, 401);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
