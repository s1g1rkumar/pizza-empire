import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { AppError } from '../utils/errors';

export type TransactionType =
  'REVENUE' | 'EXPENSE' | 'CAPEX' | 'LOAN_IN' | 'LOAN_REPAY' | 'REWARD' | 'ADMIN_ADJUST';

export type TransactionCategory =
  | 'CROP_SALE'
  | 'PIZZA_SALE'
  | 'RESTAURANT_REVENUE'
  | 'DELIVERY_CHARGE'
  | 'DELIVERY_FEE'
  | 'TIP'
  | 'FACTORY_SALE'
  | 'SUPERMARKET_REVENUE'
  | 'MALL_RENTAL'
  | 'WHOLESALE_BUY'
  | 'WHOLESALE_SELL'
  | 'SEED_COST'
  | 'RAW_MATERIAL'
  | 'PAYROLL'
  | 'SALARIES'
  | 'UPKEEP'
  | 'ELECTRICITY'
  | 'MAINTENANCE'
  | 'RENT'
  | 'MARKETING'
  | 'CONSTRUCTION'
  | 'UPGRADE'
  | 'TRAINING'
  | 'LOAN'
  | 'MISSION_REWARD'
  | 'OFFLINE_EARNINGS'
  | 'OTHER';

export interface EmployeeProductivityInput {
  skillLevel: number;
  happiness: number;
  hourlyWage: number;
  isShiftLead: boolean;
}

export class EconomyService {
  /**
   * Computes an individual employee's effective productivity multiplier.
   * Happiness < 20% results in a strike (0.0x output).
   */
  calculateEmployeeProductivity(emp: EmployeeProductivityInput): number {
    if (emp.happiness < 20) {
      return 0;
    }

    const baseSkillMultiplier = 1.0 + (Math.max(1, emp.skillLevel) - 1) * 0.12;
    let moraleMultiplier = 1.0;
    if (emp.happiness >= 80) {
      moraleMultiplier = 1.1;
    } else if (emp.happiness < 50) {
      moraleMultiplier = 0.7;
    }

    const leadBonus = emp.isShiftLead ? 1.15 : 1.0;
    return Number((baseSkillMultiplier * moraleMultiplier * leadBonus).toFixed(4));
  }

  /**
   * Aggregates total active productivity and hourly payroll for a list of employees.
   */
  summarizeWorkforce(employees: EmployeeProductivityInput[]): {
    totalProductivity: number;
    totalHourlyWage: number;
    activeWorkingCount: number;
  } {
    let totalProductivity = 0;
    let totalHourlyWage = 0;
    let activeWorkingCount = 0;

    for (const emp of employees) {
      const prod = this.calculateEmployeeProductivity(emp);
      totalProductivity += prod;
      if (prod > 0) {
        activeWorkingCount += 1;
        totalHourlyWage += emp.hourlyWage;
      }
    }

    return {
      totalProductivity: Number(totalProductivity.toFixed(2)),
      totalHourlyWage: Number(totalHourlyWage.toFixed(2)),
      activeWorkingCount,
    };
  }

  /**
   * Atomically credits or debits a player's cash balance inside an existing transaction
   * using SELECT ... FOR UPDATE and records an immutable financial_transactions row.
   * Supports optional referenceId idempotency to prevent duplicate ledger entries.
   */
  async recordCashTransaction(
    conn: PoolConnection,
    params: {
      playerId: number;
      businessId?: number | null;
      transactionType: TransactionType;
      category: TransactionCategory;
      amount: number;
      isCredit: boolean;
      referenceId?: string;
      description?: string;
    }
  ): Promise<{ balanceAfter: number; skippedDuplicate: boolean }> {
    if (!Number.isFinite(params.amount) || params.amount < 0) {
      throw new AppError(
        'Transaction amount cannot be negative',
        400,
        'INVALID_TRANSACTION_AMOUNT'
      );
    }

    const roundedAmount = Number(params.amount.toFixed(2));
    if (roundedAmount === 0) {
      const [walletRows] = await conn.query<RowDataPacket[]>(
        `SELECT cash_balance AS cashBalance FROM player_profiles WHERE id = ? FOR UPDATE`,
        [params.playerId]
      );
      return {
        balanceAfter: Number(walletRows[0]?.cashBalance ?? 0),
        skippedDuplicate: false,
      };
    }

    if (params.referenceId) {
      const [existing] = await conn.query<RowDataPacket[]>(
        `SELECT balance_after AS balanceAfter
         FROM financial_transactions
         WHERE player_id = ? AND reference_id = ?
         LIMIT 1`,
        [params.playerId, params.referenceId]
      );
      if (existing[0]) {
        return {
          balanceAfter: Number(existing[0].balanceAfter),
          skippedDuplicate: true,
        };
      }
    }

    const [walletRows] = await conn.query<RowDataPacket[]>(
      `SELECT cash_balance AS cashBalance
       FROM player_profiles
       WHERE id = ? AND deleted_at IS NULL
       FOR UPDATE`,
      [params.playerId]
    );
    if (!walletRows[0]) {
      throw new AppError('Player wallet not found', 404, 'PLAYER_NOT_FOUND');
    }

    const currentCash = Number(walletRows[0].cashBalance);
    const delta = params.isCredit ? roundedAmount : -roundedAmount;
    const nextCash = Number((currentCash + delta).toFixed(2));

    if (nextCash < 0) {
      throw new AppError('Insufficient funds for this transaction', 422, 'INSUFFICIENT_FUNDS');
    }

    await conn.query(
      `UPDATE player_profiles
       SET cash_balance = ?, net_worth = GREATEST(0, net_worth + ?)
       WHERE id = ?`,
      [nextCash, delta, params.playerId]
    );

    await conn.query<ResultSetHeader>(
      `INSERT INTO financial_transactions
         (player_id, business_id, transaction_type, category, amount, balance_after, reference_id, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        params.playerId,
        params.businessId ?? null,
        params.transactionType,
        params.category,
        roundedAmount,
        nextCash,
        params.referenceId ?? null,
        params.description ?? null,
      ]
    );

    return { balanceAfter: nextCash, skippedDuplicate: false };
  }
}
