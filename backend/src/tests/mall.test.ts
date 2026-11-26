import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import app from '../app';
import {
  calculateMallFinancials,
  calculateMallLandCost,
  calculateMallVisitors,
  calculateParkingUpgradeCost,
  MALL_BLUEPRINTS,
  MALL_UNIT_BLUEPRINTS,
} from '../utils/mallCalculator';

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

test('Mall blueprints, visitor demand, parking cost, and financials calculate accurately', () => {
  assert.equal(Object.keys(MALL_BLUEPRINTS).length, 3);
  assert.equal(Object.keys(MALL_UNIT_BLUEPRINTS).length, 5);

  const landCost2 = calculateMallLandCost(1.0, 2);
  const landCost4 = calculateMallLandCost(1.5, 4);
  assert.ok(landCost4 > landCost2);

  assert.ok(calculateParkingUpgradeCost(2) > calculateParkingUpgradeCost(1));

  const visitors = calculateMallVisitors({
    tier: 'CITY_GALLERIA',
    locationDemandMultiplier: 1.4,
    floorsCount: 2,
    parkingSpaces: 140,
    unitTypes: ['FOOD_COURT', 'SUPERMARKET', 'ENTERTAINMENT_ZONE'],
  });
  assert.ok(visitors > 2000);

  const financials = calculateMallFinancials({
    dailyVisitors: visitors,
    parkingSpaces: 140,
    baseHourlyUpkeep: 100,
    units: [
      {
        unitType: 'FOOD_COURT',
        occupancyStatus: 'LEASED',
        monthlyRent: 6000,
        operatingCostHourly: 9,
      },
      {
        unitType: 'ENTERTAINMENT_ZONE',
        occupancyStatus: 'LEASED',
        monthlyRent: 9000,
        operatingCostHourly: 16,
      },
    ],
  });
  assert.equal(financials.dailyRentalIncome, 500);
  assert.ok(financials.dailyVisitorIncome > 0);
  assert.equal(financials.dailyOperatingExpenses, 3000);
});

test('Mall API endpoints enforce JWT authentication', async () => {
  await withServer(async (baseUrl) => {
    const getRes = await fetch(`${baseUrl}/api/v1/malls`);
    assert.equal(getRes.status, 401);

    const landRes = await fetch(`${baseUrl}/api/v1/malls/lands/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locationId: 1, parcelName: 'Plaza Lot', maxFloors: 4 }),
    });
    assert.equal(landRes.status, 401);

    const constructRes = await fetch(`${baseUrl}/api/v1/malls/construct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mallLandId: 1, name: 'Test Mall', mallTier: 'BOUTIQUE_PLAZA' }),
    });
    assert.equal(constructRes.status, 401);

    const unitRes = await fetch(`${baseUrl}/api/v1/malls/1/units`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        floorNumber: 1,
        unitType: 'FOOD_COURT',
        unitName: 'Food Hall',
        occupancyStatus: 'LEASED',
      }),
    });
    assert.equal(unitRes.status, 401);

    const collectRes = await fetch(`${baseUrl}/api/v1/malls/1/rent/collect`, {
      method: 'POST',
    });
    assert.equal(collectRes.status, 401);
  });
});
