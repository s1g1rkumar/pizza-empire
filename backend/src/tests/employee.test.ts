import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import app from '../app';
import { EconomyService } from '../services/economy.service';
import {
  calculateHiringFee,
  calculateSalaryHappinessDelta,
  calculateTrainingCost,
  GLOBAL_MAX_EMPLOYEES,
  PROMOTION_MAP,
} from '../utils/employeeCalculator';

test('Employee constants, promotion rules, training cost, and happiness delta behave accurately', () => {
  assert.equal(GLOBAL_MAX_EMPLOYEES, 500);
  assert.equal(PROMOTION_MAP.PIZZA_CHEF?.nextRole, 'STORE_MANAGER');
  assert.equal(PROMOTION_MAP.PIZZA_CHEF?.minSkill, 5);

  assert.equal(calculateTrainingCost(1), 100);
  assert.equal(calculateTrainingCost(2), 145);
  assert.equal(calculateHiringFee(15, 2), 110);

  assert.ok(calculateSalaryHappinessDelta(20, 24) > 0);
  assert.ok(calculateSalaryHappinessDelta(20, 16) < 0);
});

test('EconomyService summarizes 500 employee records quickly and handles strikes', () => {
  const economy = new EconomyService();
  const staff = Array.from({ length: 500 }, (_, idx) => ({
    skillLevel: (idx % 10) + 1,
    happiness: idx === 0 ? 10 : 85, // 1 striking employee
    hourlyWage: 15,
    isShiftLead: idx % 20 === 0,
  }));

  const start = performance.now();
  const summary = economy.summarizeWorkforce(staff);
  const durationMs = performance.now() - start;

  assert.equal(summary.activeWorkingCount, 499);
  assert.equal(summary.totalHourlyWage, 499 * 15);
  assert.ok(summary.totalProductivity > 500);
  assert.ok(durationMs < 50);
});

test('Employee API endpoints enforce JWT authentication', async () => {
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1/employees`;

  try {
    const listRes = await fetch(baseUrl);
    assert.equal(listRes.status, 401);

    const hireRes = await fetch(`${baseUrl}/hire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Marco Rossi',
        department: 'FARMING',
        role: 'FARMHAND',
        skillLevel: 1,
        hourlyWage: 12,
      }),
    });
    assert.equal(hireRes.status, 401);

    const payrollRes = await fetch(`${baseUrl}/payroll/run`, { method: 'POST' });
    assert.equal(payrollRes.status, 401);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
