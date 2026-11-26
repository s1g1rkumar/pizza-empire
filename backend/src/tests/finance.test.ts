import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import { PoolConnection } from 'mysql2/promise';
import app from '../app';
import { EconomyService } from '../services/economy.service';
import { calculateBusinessValuation } from '../utils/financeCalculator';

test('calculateBusinessValuation computes accurate totals and floors goodwill at 0', () => {
  const positive = calculateBusinessValuation({
    cashBalance: 1000.5,
    businessesValue: 5000,
    inventoryValue: 800.25,
    annualizedNetProfit: 4000,
  });
  assert.equal(positive.goodwillValue, 1000);
  assert.equal(positive.totalValuation, 7800.75);

  const negativeProfit = calculateBusinessValuation({
    cashBalance: 500,
    businessesValue: 2500,
    inventoryValue: 0,
    annualizedNetProfit: -1200,
  });
  assert.equal(negativeProfit.goodwillValue, 0);
  assert.equal(negativeProfit.totalValuation, 3000);
});

test('EconomyService.recordCashTransaction prevents duplicate payments using referenceId', async () => {
  let cashBalance = 500;
  const seenRefs = new Map<string, number>();

  const mockConn = {
    async query(sql: string, params: unknown[] = []) {
      const norm = sql.trim().toUpperCase();
      if (norm.startsWith('SELECT BALANCE_AFTER')) {
        const ref = String(params[1]);
        if (seenRefs.has(ref)) {
          return [[{ balanceAfter: seenRefs.get(ref) }]];
        }
        return [[]];
      }
      if (norm.startsWith('SELECT CASH_BALANCE')) {
        return [[{ cashBalance }]];
      }
      if (norm.startsWith('UPDATE PLAYER_PROFILES')) {
        cashBalance = Number(params[0]);
        return [{ affectedRows: 1 }];
      }
      if (norm.startsWith('INSERT INTO FINANCIAL_TRANSACTIONS')) {
        const ref = params[6] ? String(params[6]) : null;
        if (ref) seenRefs.set(ref, Number(params[5]));
        return [{ insertId: 1 }];
      }
      return [[]];
    },
  } as unknown as PoolConnection;

  const economy = new EconomyService();
  const first = await economy.recordCashTransaction(mockConn, {
    playerId: 1,
    transactionType: 'EXPENSE',
    category: 'ELECTRICITY',
    amount: 75,
    isCredit: false,
    referenceId: 'opex_1_bill_001',
    description: 'Electricity bill',
  });
  assert.equal(first.balanceAfter, 425);
  assert.equal(first.skippedDuplicate, false);

  // Duplicate retry with same referenceId must be skipped
  const second = await economy.recordCashTransaction(mockConn, {
    playerId: 1,
    transactionType: 'EXPENSE',
    category: 'ELECTRICITY',
    amount: 75,
    isCredit: false,
    referenceId: 'opex_1_bill_001',
    description: 'Electricity bill',
  });
  assert.equal(second.balanceAfter, 425);
  assert.equal(second.skippedDuplicate, true);
  assert.equal(cashBalance, 425);
});

test('Finance API endpoints enforce JWT authentication', async () => {
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1/finance`;

  try {
    const getRes = await fetch(baseUrl);
    assert.equal(getRes.status, 401);

    const payRes = await fetch(`${baseUrl}/operating-costs/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'ELECTRICITY',
        amount: 50,
        idempotencyKey: 'bill_1234',
      }),
    });
    assert.equal(payRes.status, 401);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
