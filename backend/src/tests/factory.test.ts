import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import app from '../app';
import {
  calculateFactorySpeedMultiplier,
  calculateMachinePurchaseCost,
  FACTORY_BLUEPRINTS,
} from '../utils/factoryCalculator';

test('FACTORY_BLUEPRINTS covers all 5 factory types and machine/speed scaling', () => {
  assert.equal(Object.keys(FACTORY_BLUEPRINTS).length, 5);
  assert.equal(calculateMachinePurchaseCost(1800, 1), 1800);
  assert.equal(calculateMachinePurchaseCost(1800, 2), 2610);

  // 3 machines -> +30% (1.30), employeeBonus 1.5 -> 1.95x
  assert.equal(calculateFactorySpeedMultiplier(3, 1.5), 1.95);
  // Clamped at 5.0x
  assert.equal(calculateFactorySpeedMultiplier(20, 3.0), 5.0);
});

test('Factory API endpoints enforce JWT authentication', async () => {
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1/factories`;

  try {
    const getRes = await fetch(baseUrl);
    assert.equal(getRes.status, 401);

    const constructRes = await fetch(`${baseUrl}/construct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Mill 1', factoryType: 'FLOUR_MILL', locationId: 1 }),
    });
    assert.equal(constructRes.status, 401);

    const transferRes = await fetch(`${baseUrl}/1/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toBusinessId: 2, itemId: 1, quantity: 10 }),
    });
    assert.equal(transferRes.status, 401);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
