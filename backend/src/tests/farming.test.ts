import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import app from '../app';
import {
  calculateEffectiveGrowthSeconds,
  calculateHarvestYield,
  calculatePlotUnlockCost,
  calculateUpgradeCost,
} from '../utils/farmingCalculator';

test('calculateEffectiveGrowthSeconds applies irrigation, watering, and fertilizer modifiers', () => {
  // Base 100s, no irrigation, not watered (40 < 60 req), no fertilizer -> 100s
  assert.equal(
    calculateEffectiveGrowthSeconds({
      baseGrowthSeconds: 100,
      irrigationLevel: 0,
      hydrationPct: 40,
      waterRequirement: 60,
      fertilizerType: 'NONE',
    }),
    100
  );

  // Base 100s, irrigation Lv 2 (-16% -> 84s), watered (100 >= 60 -> *0.75 = 63s), BIO_NUTRIENT (*0.80 = 50.4 -> 50s)
  assert.equal(
    calculateEffectiveGrowthSeconds({
      baseGrowthSeconds: 100,
      irrigationLevel: 2,
      hydrationPct: 100,
      waterRequirement: 60,
      fertilizerType: 'BIO_NUTRIENT',
    }),
    50
  );

  // Minimum clamp of 5s
  assert.equal(
    calculateEffectiveGrowthSeconds({
      baseGrowthSeconds: 6,
      irrigationLevel: 10,
      hydrationPct: 100,
      waterRequirement: 50,
      fertilizerType: 'BIO_NUTRIENT',
    }),
    5
  );
});

test('calculateHarvestYield applies crop quality and fertilizer yield bonuses', () => {
  assert.equal(calculateHarvestYield({ baseYield: 4, quality: 1.0, fertilizerType: 'NONE' }), 4);
  // 4 * 1.0 * 1.25 = 5
  assert.equal(calculateHarvestYield({ baseYield: 4, quality: 1.0, fertilizerType: 'COMPOST' }), 5);
  // 4 * 1.15 * 1.50 = 6.9 -> 7
  assert.equal(
    calculateHarvestYield({ baseYield: 4, quality: 1.15, fertilizerType: 'BIO_NUTRIENT' }),
    7
  );
});

test('calculatePlotUnlockCost and calculateUpgradeCost scale exponentially', () => {
  assert.equal(calculatePlotUnlockCost(1), 0);
  assert.equal(calculatePlotUnlockCost(2), 0);
  assert.equal(calculatePlotUnlockCost(3), 150);
  assert.equal(calculatePlotUnlockCost(4), 247);

  assert.equal(calculateUpgradeCost(250, 1.75, 0), 250);
  assert.equal(calculateUpgradeCost(250, 1.75, 1), 437);
});

test('Farming API endpoints require JWT authentication', async () => {
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1/farm`;

  try {
    const getRes = await fetch(baseUrl);
    assert.equal(getRes.status, 401);

    const buyRes = await fetch(`${baseUrl}/seeds/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cropId: 1, quantity: 5 }),
    });
    assert.equal(buyRes.status, 401);

    const harvestRes = await fetch(`${baseUrl}/plots/1/harvest`, { method: 'POST' });
    assert.equal(harvestRes.status, 401);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
