import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import { PoolConnection } from 'mysql2/promise';
import app from '../app';
import { env } from '../config/env';
import { EconomyService } from '../services/economy.service';
import { signAccessToken, verifyAccessToken } from '../utils/jwt';
import { calculateMallFinancials, calculateMallVisitors } from '../utils/mallCalculator';
import { calculateSupermarketDemand } from '../utils/supermarketCalculator';

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

test('Security: expired JWT tokens are rejected with 401 and SQL injection inputs are blocked', async () => {
  const expiredToken = jwt.sign({ userId: 1, playerId: 1, role: 'PLAYER' }, env.jwt.accessSecret, {
    expiresIn: -10,
  });
  assert.throws(() => verifyAccessToken(expiredToken));

  await withServer(async (baseUrl) => {
    const expiredRes = await fetch(`${baseUrl}/api/v1/auth/profile`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert.equal(expiredRes.status, 401);

    // SQL injection attempt in login email rejected by Joi validation before reaching SQL
    const sqliLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: "' OR '1'='1", password: 'password123' }),
    });
    assert.equal(sqliLogin.status, 400);

    // Player role cannot access admin endpoints
    const playerToken = signAccessToken({ userId: 10, playerId: 10, role: 'PLAYER' });
    const adminProbe = await fetch(`${baseUrl}/api/v1/admin/players`, {
      headers: { Authorization: `Bearer ${playerToken}` },
    });
    assert.equal(adminProbe.status, 403);

    // Invalid non-numeric ID params are rejected with 400 before reaching DB
    const adminToken = signAccessToken({ userId: 1, playerId: 1, role: 'ADMIN' });
    const badParamRes = await fetch(`${baseUrl}/api/v1/admin/players/not-a-number/account`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    assert.equal(badParamRes.status, 400);
  });
});

test('Finance & Security: EconomyService rejects negative amounts and prevents negative balance', async () => {
  const economyService = new EconomyService();
  let cash = 100;

  const mockConn = {
    query: async (sql: string, params?: unknown[]) => {
      if (sql.includes('FROM financial_transactions')) {
        return [[]];
      }
      if (sql.includes('SELECT cash_balance')) {
        return [[{ cashBalance: cash }]];
      }
      if (sql.includes('UPDATE player_profiles')) {
        const nextCash = Number(params?.[0] ?? 0);
        cash = nextCash;
        return [{ affectedRows: 1 }];
      }
      if (sql.includes('INSERT INTO financial_transactions')) {
        return [{ insertId: 1 }];
      }
      return [[]];
    },
  } as unknown as PoolConnection;

  // Negative amount exploit attempt
  await assert.rejects(
    () =>
      economyService.recordCashTransaction(mockConn, {
        playerId: 1,
        transactionType: 'EXPENSE',
        category: 'OTHER',
        amount: -500,
        isCredit: false,
      }),
    (err: { code?: string }) => err.code === 'INVALID_TRANSACTION_AMOUNT'
  );

  // Overdraft / negative balance attempt
  await assert.rejects(
    () =>
      economyService.recordCashTransaction(mockConn, {
        playerId: 1,
        transactionType: 'EXPENSE',
        category: 'WHOLESALE_BUY',
        amount: 250,
        isCredit: false,
      }),
    (err: { code?: string }) => err.code === 'INSUFFICIENT_FUNDS'
  );
  assert.equal(cash, 100);
});

test('Performance: 500 employees, 50 supermarkets, and 20 malls compute under 50ms', () => {
  const economyService = new EconomyService();
  const start = performance.now();

  const workforce = Array.from({ length: 500 }, (_, i) => ({
    skillLevel: 1 + (i % 10),
    happiness: 60 + (i % 40),
    hourlyWage: 12 + (i % 15),
    isShiftLead: i % 20 === 0,
  }));
  const summary = economyService.summarizeWorkforce(workforce);
  assert.equal(summary.activeWorkingCount, 500);

  let totalRetailDemand = 0;
  for (let s = 0; s < 50; s += 1) {
    for (let p = 0; p < 20; p += 1) {
      totalRetailDemand += calculateSupermarketDemand({
        tier: 'SUPERMARKET',
        locationDemandMultiplier: 1.3,
        priceElasticity: 1.0,
        baseRetailPrice: 10,
        customPrice: 9.5,
        aisleLevel: 3,
        checkoutLanes: 4,
        coldStorageLevel: 2,
        decorLevel: 2,
        employeeProductivity: 3.5,
        availableStock: 500,
      });
    }
  }
  assert.ok(totalRetailDemand > 0);

  for (let m = 0; m < 20; m += 1) {
    const visitors = calculateMallVisitors({
      tier: 'MEGA_MALL',
      locationDemandMultiplier: 1.4,
      floorsCount: 4,
      parkingSpaces: 300,
      unitTypes: ['FOOD_COURT', 'SUPERMARKET', 'ENTERTAINMENT_ZONE', 'RESTAURANT'],
    });
    calculateMallFinancials({
      dailyVisitors: visitors,
      parkingSpaces: 300,
      baseHourlyUpkeep: 240,
      units: [
        {
          unitType: 'FOOD_COURT',
          occupancyStatus: 'LEASED',
          monthlyRent: 5500,
          operatingCostHourly: 9,
        },
      ],
    });
  }

  const elapsedMs = performance.now() - start;
  assert.ok(elapsedMs < 50, `Expected < 50ms, took ${elapsedMs.toFixed(2)}ms`);
});
