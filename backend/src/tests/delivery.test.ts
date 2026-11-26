import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import app from '../app';
import {
  calculateDeliveryDurationSeconds,
  calculateDeliveryTip,
  calculateVehicleUpgradeCost,
  VEHICLE_BLUEPRINTS,
} from '../utils/deliveryCalculator';

test('VEHICLE_BLUEPRINTS covers 5 vehicle types and delivery duration/tip calculations', () => {
  assert.equal(Object.keys(VEHICLE_BLUEPRINTS).length, 5);
  assert.equal(calculateVehicleUpgradeCost(1000, 1), 600);

  // 4km * 12 = 48s / (2.0 speed * 1.2 driver) = 20s
  assert.equal(
    calculateDeliveryDurationSeconds({
      distanceKm: 4,
      vehicleSpeedMultiplier: 2.0,
      driverProductivity: 1.2,
    }),
    20
  );

  // On-time tip: 15% + (1.2 - 1)*5% = 16% of 50 = 8.00
  assert.equal(
    calculateDeliveryTip({ orderAmount: 50, isOnTime: true, driverProductivity: 1.2 }),
    8.0
  );
  // Late tip: 4% of 50 = 2.00
  assert.equal(
    calculateDeliveryTip({ orderAmount: 50, isOnTime: false, driverProductivity: 1.0 }),
    2.0
  );
});

test('Delivery API endpoints enforce JWT authentication', async () => {
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1/delivery`;

  try {
    const getRes = await fetch(baseUrl);
    assert.equal(getRes.status, 401);

    const buyRes = await fetch(`${baseUrl}/vehicles/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleType: 'BICYCLE', name: 'Bike 1' }),
    });
    assert.equal(buyRes.status, 401);

    const dispatchRes = await fetch(`${baseUrl}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId: 1,
        itemId: 1,
        quantity: 1,
        zoneId: 1,
        vehicleId: 1,
      }),
    });
    assert.equal(dispatchRes.status, 401);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
