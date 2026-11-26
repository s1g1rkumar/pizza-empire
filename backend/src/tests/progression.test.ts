import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import app from '../app';
import {
  checkLevelUnlockEligibility,
  PlayerMetricsSnapshot,
  resolveMetricValue,
} from '../utils/progressionCalculator';

test('resolveMetricValue maps all real-game activity metrics accurately', () => {
  const stats: PlayerMetricsSnapshot = {
    totalCropsHarvested: 120,
    totalPizzasSold: 45,
    totalBatchesProcessed: 10,
    totalDeliveriesCompleted: 5,
    activeEmployees: 12,
    unlockedPlots: 4,
    restaurantsOwned: 1,
    farmUpgrades: 2,
    cashBalance: 3450.75,
    netWorth: 12500.5,
    xpLevel: 6,
  };

  assert.equal(resolveMetricValue('TOTAL_CROPS_HARVESTED', stats), 120);
  assert.equal(resolveMetricValue('TOTAL_PIZZAS_SOLD', stats), 45);
  assert.equal(resolveMetricValue('ACTIVE_EMPLOYEES', stats), 12);
  assert.equal(resolveMetricValue('RESTAURANTS_OWNED', stats), 1);
  assert.equal(resolveMetricValue('CASH_BALANCE', stats), 3450);
  assert.equal(resolveMetricValue('NET_WORTH', stats), 12500);
});

test('checkLevelUnlockEligibility enforces XP, Cash, and Net Worth thresholds', () => {
  const ineligible = checkLevelUnlockEligibility({
    playerXp: 500,
    playerCash: 1000,
    playerNetWorth: 1500,
    minXp: 1960,
    minCash: 2500,
    minNetWorth: 3500,
  });
  assert.equal(ineligible.eligible, false);
  assert.equal(ineligible.reasons.length, 3);

  const eligible = checkLevelUnlockEligibility({
    playerXp: 2000,
    playerCash: 3000,
    playerNetWorth: 4000,
    minXp: 1960,
    minCash: 2500,
    minNetWorth: 3500,
  });
  assert.equal(eligible.eligible, true);
  assert.equal(eligible.reasons.length, 0);
});

test('Progression API endpoints enforce JWT authentication', async () => {
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1/progression`;

  try {
    const getRes = await fetch(baseUrl);
    assert.equal(getRes.status, 401);

    const unlockRes = await fetch(`${baseUrl}/levels/unlock`, { method: 'POST' });
    assert.equal(unlockRes.status, 401);

    const claimMissionRes = await fetch(`${baseUrl}/missions/1/claim`, { method: 'POST' });
    assert.equal(claimMissionRes.status, 401);

    const claimAchRes = await fetch(`${baseUrl}/achievements/1/claim`, { method: 'POST' });
    assert.equal(claimAchRes.status, 401);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
