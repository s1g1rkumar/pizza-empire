import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import app from '../app';
import {
  calculateCustomerDemand,
  calculateOrderSatisfaction,
  RESTAURANT_BLUEPRINTS,
  updateAverageRating,
} from '../utils/restaurantCalculator';

test('calculateCustomerDemand returns 0 when no pizza is available and scales with location, pricing, and quality', () => {
  assert.equal(
    calculateCustomerDemand({
      diningTables: 5,
      locationDemandMultiplier: 1.5,
      reputation: 50,
      avgRating: 4.5,
      avgStarQuality: 3,
      priceRatio: 1.0,
      hasAvailablePizza: false,
      typeDemandBonus: 1.35,
    }),
    0
  );

  const fairDemand = calculateCustomerDemand({
    diningTables: 4,
    locationDemandMultiplier: 1.0,
    reputation: 20,
    avgRating: 4.0,
    avgStarQuality: 1,
    priceRatio: 1.0,
    hasAvailablePizza: true,
    typeDemandBonus: 1.0,
  });

  const overpricedDemand = calculateCustomerDemand({
    diningTables: 4,
    locationDemandMultiplier: 1.0,
    reputation: 20,
    avgRating: 4.0,
    avgStarQuality: 1,
    priceRatio: 1.5,
    hasAvailablePizza: true,
    typeDemandBonus: 1.0,
  });

  assert.ok(fairDemand > overpricedDemand);
  assert.equal(Object.keys(RESTAURANT_BLUEPRINTS).length, 5);
});

test('calculateOrderSatisfaction and updateAverageRating stay within 1.0 - 5.0', () => {
  const highSat = calculateOrderSatisfaction({ starQuality: 5, decorLevel: 5, priceRatio: 0.9 });
  assert.equal(highSat, 4.96);

  const clampedMax = calculateOrderSatisfaction({ starQuality: 5, decorLevel: 5, priceRatio: 0.5 });
  assert.equal(clampedMax, 5.0);

  const lowSat = calculateOrderSatisfaction({ starQuality: 1, decorLevel: 1, priceRatio: 2.0 });
  assert.ok(lowSat >= 1.0 && lowSat < 3.5);

  const updated = updateAverageRating(4.0, 4, 5.0);
  assert.equal(updated.totalRatings, 5);
  assert.equal(updated.avgRating, 4.2);
});

test('Restaurant API endpoints enforce JWT authentication', async () => {
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1/restaurants`;

  try {
    const getRes = await fetch(baseUrl);
    assert.equal(getRes.status, 401);

    const constructRes = await fetch(`${baseUrl}/construct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Pizza', restaurantType: 'SMALL_SHOP', locationId: 1 }),
    });
    assert.equal(constructRes.status, 401);

    const serveRes = await fetch(`${baseUrl}/1/serve`, { method: 'POST' });
    assert.equal(serveRes.status, 401);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
