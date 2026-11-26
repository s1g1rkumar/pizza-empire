import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import app from '../app';
import { PoolConnection } from 'mysql2/promise';
import { DeliveryService } from '../services/delivery.service';
import { SimulationScheduler } from '../jobs/scheduler';
import { EconomyService } from '../services/economy.service';
import { OfflineService } from '../services/offline.service';
import {
  applyXpGain,
  calculateElapsedSeconds,
  secondsToHours,
  xpRequiredForLevel,
} from '../utils/simulationTime';

test('simulationTime utilities clamp elapsed seconds and compute XP curve', () => {
  const t0 = new Date('2026-11-25T00:00:00.000Z');
  const t1 = new Date('2026-11-25T10:00:00.000Z'); // 10 hours = 36000s
  const elapsed = calculateElapsedSeconds(t0, t1, 14400); // 4h cap

  assert.equal(elapsed.rawElapsedSeconds, 36000);
  assert.equal(elapsed.effectiveSeconds, 14400);
  assert.equal(elapsed.wasCapped, true);
  assert.equal(secondsToHours(7200), 2);

  assert.equal(xpRequiredForLevel(1), 100);
  const gained = applyXpGain(1, 50, 80); // total 130 -> Lv 2 with 30 XP
  assert.equal(gained.xpLevel, 2);
  assert.equal(gained.currentXp, 30);
  assert.equal(gained.levelsGained, 1);
});

test('EconomyService calculates employee productivity, morale tiers, and strikes', () => {
  const economy = new EconomyService();

  // Happy shift lead at skill 1: 1.0 * 1.10 * 1.15 = 1.265
  const leadProd = economy.calculateEmployeeProductivity({
    skillLevel: 1,
    happiness: 90,
    hourlyWage: 15,
    isShiftLead: true,
  });
  assert.equal(leadProd, 1.265);

  // Striking employee (< 20 happiness) produces 0
  const strikeProd = economy.calculateEmployeeProductivity({
    skillLevel: 10,
    happiness: 15,
    hourlyWage: 50,
    isShiftLead: false,
  });
  assert.equal(strikeProd, 0);

  const summary = economy.summarizeWorkforce([
    { skillLevel: 1, happiness: 90, hourlyWage: 15, isShiftLead: true },
    { skillLevel: 10, happiness: 15, hourlyWage: 50, isShiftLead: false },
  ]);
  assert.equal(summary.activeWorkingCount, 1);
  assert.equal(summary.totalHourlyWage, 15);
});

test('OfflineService caps duration and enforces zero-negative earnings protection', () => {
  const offline = new OfflineService();
  const start = new Date('2026-11-25T00:00:00.000Z');
  const end = new Date('2026-11-25T08:00:00.000Z'); // 8h away, capped at 4h

  const profitable = offline.calculateOfflineEarnings({
    lastTickAt: start,
    now: end,
    offlineCapSeconds: 14400,
    efficiencyRate: 0.6,
    activeBusinessCount: 2,
    totalProductivity: 4,
    totalHourlyWage: 20,
    totalHourlyUpkeep: 10,
  });
  assert.equal(profitable.wasCapped, true);
  assert.equal(profitable.effectiveSeconds, 14400);
  assert.ok(profitable.netCashEarned > 0);
  assert.ok(profitable.xpEarned > 0);

  // Overwhelming wages should clamp netCashEarned to 0 (never negative)
  const unprofitable = offline.calculateOfflineEarnings({
    lastTickAt: start,
    now: end,
    offlineCapSeconds: 14400,
    efficiencyRate: 0.6,
    activeBusinessCount: 1,
    totalProductivity: 0.5,
    totalHourlyWage: 500,
    totalHourlyUpkeep: 100,
  });
  assert.equal(unprofitable.netCashEarned, 0);
});

test('SimulationScheduler prevents overlapping executions of the same job', async () => {
  const scheduler = new SimulationScheduler();
  let runCount = 0;

  scheduler.registerJob('slow-job', 60000, async () => {
    runCount += 1;
    await new Promise((resolve) => setTimeout(resolve, 40));
  });

  const [first, second] = await Promise.all([
    scheduler.runJobOnce('slow-job'),
    scheduler.runJobOnce('slow-job'),
  ]);

  assert.equal(first, true);
  assert.equal(second, false);
  assert.equal(runCount, 1);
});

test('Game simulation endpoints require JWT authentication', async () => {
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;

  try {
    const syncRes = await fetch(`${baseUrl}/game/sync`, { method: 'POST' });
    assert.equal(syncRes.status, 401);

    const claimRes = await fetch(`${baseUrl}/game/offline/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 1 }),
    });
    assert.equal(claimRes.status, 401);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('DeliveryService.settleArrivedDeliveries completes order, credits cash, and frees vehicle', async () => {
  const deliveryService = new DeliveryService();
  const executedSql: string[] = [];

  const mockConn = {
    query: async (sql: string) => {
      executedSql.push(sql);
      if (sql.includes('FROM deliveries d')) {
        return [
          [
            {
              id: 10,
              orderId: 20,
              vehicleId: 30,
              deliveryFee: 4,
              etaAt: new Date(Date.now() - 1000),
              orderTotal: 22,
              restaurantId: 1,
              restaurantBusinessId: 2,
              driverSkill: 2,
              driverHappiness: 85,
              driverWage: 14,
              driverLead: 0,
            },
          ],
        ];
      }
      if (sql.includes('FROM financial_transactions')) {
        return [[]];
      }
      if (sql.includes('SELECT cash_balance')) {
        return [[{ cashBalance: 500 }]];
      }
      if (sql.includes('SELECT xp_level')) {
        return [[{ xpLevel: 1, currentXp: 0 }]];
      }
      return [{ affectedRows: 1 }];
    },
  } as unknown as PoolConnection;

  const settled = await deliveryService.settleArrivedDeliveries(mockConn, 1);
  assert.equal(settled, 1);
  assert.ok(executedSql.some((s) => s.includes('UPDATE deliveries')));
  assert.ok(executedSql.some((s) => s.includes('UPDATE customer_orders')));
  assert.ok(executedSql.some((s) => s.includes('UPDATE delivery_vehicles') && s.includes('IDLE')));
  assert.ok(executedSql.some((s) => s.includes('INSERT INTO financial_transactions')));
});
