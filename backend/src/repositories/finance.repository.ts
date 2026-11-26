import { RowDataPacket } from 'mysql2/promise';
import { dbPool } from '../database/pool';
import { BusinessValuationBreakdown, calculateBusinessValuation } from '../utils/financeCalculator';

export interface FinanceDashboardDTO {
  summary: {
    cashBalance: number;
    dailyRevenue: number;
    dailyExpenses: number;
    dailyNetProfit: number;
    monthlyRevenue: number;
    monthlyExpenses: number;
    monthlyNetProfit: number;
    hourlyPayroll: number;
    hourlyOperatingCosts: number;
    totalCapexInvested: number;
  };
  valuation: BusinessValuationBreakdown;
  dailyReportSeries: Array<{ date: string; revenue: number; expenses: number; netProfit: number }>;
  monthlyReportSeries: Array<{
    month: string;
    revenue: number;
    expenses: number;
    netProfit: number;
  }>;
  incomeByCategory: Array<{ category: string; total: number }>;
  expensesByCategory: Array<{ category: string; total: number }>;
  history: Array<{
    id: number;
    businessId: number | null;
    businessName: string | null;
    transactionType: string;
    category: string;
    amount: number;
    balanceAfter: number;
    description: string | null;
    createdAt: string;
  }>;
}

export class FinanceRepository {
  async getFinanceDashboard(
    playerId: number,
    filters?: { transactionType?: string; category?: string }
  ): Promise<FinanceDashboardDTO> {
    const [playerRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT cash_balance AS cashBalance FROM player_profiles WHERE id = ? LIMIT 1`,
      [playerId]
    );
    const cashBalance = Number(playerRows[0]?.cashBalance ?? 0);

    // 24h & 30d totals
    const [periodRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         COALESCE(SUM(CASE WHEN created_at >= (UTC_TIMESTAMP() - INTERVAL 24 HOUR) AND transaction_type IN ('REVENUE', 'REWARD') THEN amount ELSE 0 END), 0) AS dailyRev,
         COALESCE(SUM(CASE WHEN created_at >= (UTC_TIMESTAMP() - INTERVAL 24 HOUR) AND transaction_type IN ('EXPENSE', 'CAPEX', 'LOAN_REPAY') THEN amount ELSE 0 END), 0) AS dailyExp,
         COALESCE(SUM(CASE WHEN created_at >= (UTC_TIMESTAMP() - INTERVAL 30 DAY) AND transaction_type IN ('REVENUE', 'REWARD') THEN amount ELSE 0 END), 0) AS monthlyRev,
         COALESCE(SUM(CASE WHEN created_at >= (UTC_TIMESTAMP() - INTERVAL 30 DAY) AND transaction_type IN ('EXPENSE', 'CAPEX', 'LOAN_REPAY') THEN amount ELSE 0 END), 0) AS monthlyExp,
         COALESCE(SUM(CASE WHEN transaction_type = 'CAPEX' THEN amount ELSE 0 END), 0) AS totalCapex
       FROM financial_transactions
       WHERE player_id = ?`,
      [playerId]
    );
    const pr = periodRows[0] ?? {};
    const dailyRevenue = Number(pr.dailyRev ?? 0);
    const dailyExpenses = Number(pr.dailyExp ?? 0);
    const monthlyRevenue = Number(pr.monthlyRev ?? 0);
    const monthlyExpenses = Number(pr.monthlyExp ?? 0);
    const totalCapexInvested = Number(pr.totalCapex ?? 0);

    // Payroll & Operating Costs
    const [payrollRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(hourly_wage), 0) AS hourlyPayroll
       FROM employees
       WHERE player_id = ? AND deleted_at IS NULL AND employment_status = 'ACTIVE'`,
      [playerId]
    );
    const hourlyPayroll = Number(payrollRows[0]?.hourlyPayroll ?? 0);

    const [bizRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS bizCount, COALESCE(SUM(level * 2500), 0) AS bizAssetVal, COALESCE(SUM(hourly_upkeep), 0) AS hourlyUpkeep
       FROM businesses
       WHERE player_id = ? AND deleted_at IS NULL`,
      [playerId]
    );
    const businessesValue = Number(bizRows[0]?.bizAssetVal ?? 0) + totalCapexInvested;
    const hourlyOperatingCosts = Number(bizRows[0]?.hourlyUpkeep ?? 0);

    const [invValRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(bi.quantity * GREATEST(ii.unit_wholesale_sell, ii.unit_wholesale_buy)), 0) AS invValue
       FROM business_inventory bi
       INNER JOIN inventory_items ii ON ii.id = bi.item_id
       WHERE bi.player_id = ?`,
      [playerId]
    );
    const inventoryValue = Number(invValRows[0]?.invValue ?? 0);

    const monthlyNetProfit = Number((monthlyRevenue - monthlyExpenses).toFixed(2));
    const valuation = calculateBusinessValuation({
      cashBalance,
      businessesValue,
      inventoryValue,
      annualizedNetProfit: monthlyNetProfit * 12,
    });

    // Daily report series (last 14 days)
    const [dailyRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         DATE_FORMAT(created_at, '%Y-%m-%d') AS dateLabel,
         COALESCE(SUM(CASE WHEN transaction_type IN ('REVENUE', 'REWARD') THEN amount ELSE 0 END), 0) AS revenue,
         COALESCE(SUM(CASE WHEN transaction_type IN ('EXPENSE', 'CAPEX', 'LOAN_REPAY') THEN amount ELSE 0 END), 0) AS expenses
       FROM financial_transactions
       WHERE player_id = ? AND created_at >= (UTC_TIMESTAMP() - INTERVAL 14 DAY)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
       ORDER BY MIN(created_at) ASC`,
      [playerId]
    );

    // Monthly report series (last 12 months)
    const [monthlyRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         DATE_FORMAT(created_at, '%Y-%m') AS monthLabel,
         COALESCE(SUM(CASE WHEN transaction_type IN ('REVENUE', 'REWARD') THEN amount ELSE 0 END), 0) AS revenue,
         COALESCE(SUM(CASE WHEN transaction_type IN ('EXPENSE', 'CAPEX', 'LOAN_REPAY') THEN amount ELSE 0 END), 0) AS expenses
       FROM financial_transactions
       WHERE player_id = ? AND created_at >= (UTC_TIMESTAMP() - INTERVAL 12 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY MIN(created_at) ASC`,
      [playerId]
    );

    // Category breakdowns
    const [incCatRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT category, COALESCE(SUM(amount), 0) AS total
       FROM financial_transactions
       WHERE player_id = ? AND transaction_type IN ('REVENUE', 'REWARD')
       GROUP BY category
       ORDER BY total DESC`,
      [playerId]
    );

    const [expCatRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT category, COALESCE(SUM(amount), 0) AS total
       FROM financial_transactions
       WHERE player_id = ? AND transaction_type IN ('EXPENSE', 'CAPEX', 'LOAN_REPAY')
       GROUP BY category
       ORDER BY total DESC`,
      [playerId]
    );

    // Filtered transaction history
    const where: string[] = ['ft.player_id = ?'];
    const params: unknown[] = [playerId];
    if (filters?.transactionType) {
      where.push('ft.transaction_type = ?');
      params.push(filters.transactionType);
    }
    if (filters?.category) {
      where.push('ft.category = ?');
      params.push(filters.category);
    }

    const [histRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         ft.id, ft.business_id AS businessId, b.name AS businessName,
         ft.transaction_type AS transactionType, ft.category,
         ft.amount, ft.balance_after AS balanceAfter,
         ft.description, ft.created_at AS createdAt
       FROM financial_transactions ft
       LEFT JOIN businesses b ON b.id = ft.business_id
       WHERE ${where.join(' AND ')}
       ORDER BY ft.created_at DESC, ft.id DESC
       LIMIT 40`,
      params
    );

    return {
      summary: {
        cashBalance,
        dailyRevenue,
        dailyExpenses,
        dailyNetProfit: Number((dailyRevenue - dailyExpenses).toFixed(2)),
        monthlyRevenue,
        monthlyExpenses,
        monthlyNetProfit,
        hourlyPayroll,
        hourlyOperatingCosts,
        totalCapexInvested,
      },
      valuation,
      dailyReportSeries: dailyRows.map((d) => {
        const rev = Number(d.revenue ?? 0);
        const exp = Number(d.expenses ?? 0);
        return {
          date: String(d.dateLabel),
          revenue: rev,
          expenses: exp,
          netProfit: Number((rev - exp).toFixed(2)),
        };
      }),
      monthlyReportSeries: monthlyRows.map((m) => {
        const rev = Number(m.revenue ?? 0);
        const exp = Number(m.expenses ?? 0);
        return {
          month: String(m.monthLabel),
          revenue: rev,
          expenses: exp,
          netProfit: Number((rev - exp).toFixed(2)),
        };
      }),
      incomeByCategory: incCatRows.map((c) => ({
        category: String(c.category),
        total: Number(c.total),
      })),
      expensesByCategory: expCatRows.map((c) => ({
        category: String(c.category),
        total: Number(c.total),
      })),
      history: histRows.map((h) => ({
        id: Number(h.id),
        businessId: h.businessId ? Number(h.businessId) : null,
        businessName: h.businessName ? String(h.businessName) : null,
        transactionType: String(h.transactionType),
        category: String(h.category),
        amount: Number(h.amount),
        balanceAfter: Number(h.balanceAfter),
        description: h.description ? String(h.description) : null,
        createdAt: new Date(String(h.createdAt)).toISOString(),
      })),
    };
  }
}
