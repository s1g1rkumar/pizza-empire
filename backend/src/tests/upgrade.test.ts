import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import app from '../app';
import {
  calculateBusinessUpgradeCost,
  computeUpgradeMultipliers,
} from '../utils/upgradeCalculator';

test('calculateBusinessUpgradeCost and computeUpgradeMultipliers scale game engine bonuses', () => {
  assert.equal(calculateBusinessUpgradeCost(1000, 1.75, 0), 1000);
  assert.equal(calculateBusinessUpgradeCost(1000, 1.75, 2), 3062);

  const mults = computeUpgradeMultipliers([
    { code: 'UPG_MGMT_MARKETING', currentLevel: 5, effectPerLevel: 0.08 }, // +0.40 -> 1.40x
    { code: 'UPG_MGMT_EFFICIENCY', currentLevel: 5, effectPerLevel: 0.04 }, // -0.20 -> 0.80
    { code: 'UPG_MGMT_AUTOMATION', currentLevel: 3, effectPerLevel: 0.07 }, // +0.21 -> 1.21x
    { code: 'UPG_MGMT_TRAINING', currentLevel: 4, effectPerLevel: 0.05 }, // +0.20 -> 1.20x
  ]);

  assert.equal(mults.revenueMultiplier, 1.4);
  assert.equal(mults.upkeepReductionFactor, 0.8);
  assert.equal(mults.automationBonus, 1.21);
  assert.equal(mults.employeeProductivityBonus, 1.2);

  // Upkeep reduction is safely floored at 0.40 (max 60% reduction)
  const maxed = computeUpgradeMultipliers([
    { code: 'UPG_MGMT_EFFICIENCY', currentLevel: 20, effectPerLevel: 0.05 },
  ]);
  assert.equal(maxed.upkeepReductionFactor, 0.4);
});

test('Upgrade API endpoints enforce JWT authentication', async () => {
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1/upgrades`;

  try {
    const getRes = await fetch(baseUrl);
    assert.equal(getRes.status, 401);

    const buyRes = await fetch(`${baseUrl}/UPG_MGMT_MARKETING/purchase`, { method: 'POST' });
    assert.equal(buyRes.status, 401);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
