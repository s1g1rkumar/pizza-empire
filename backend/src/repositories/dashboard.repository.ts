import { RowDataPacket } from 'mysql2/promise';
import { dbPool } from '../database/pool';

export interface DashboardDataDTO {
  profile: {
    displayName: string;
    cashBalance: number;
    gemsBalance: number;
    netWorth: number;
    reputation: number;
    maxEmployeesAllowed: number;
  };
  progression: {
    currentLevelNumber: number;
    currentLevelName: string;
    xpLevel: number;
    currentXp: number;
    nextLevelXp: number;
  };
  financials: {
    currentBalance: number;
    dailyRevenue: number;
    dailyExpenses: number;
    netProfit: number;
    performanceSeries: Array<{ label: string; revenue: number; expenses: number }>;
  };
  employees: {
    activeCount: number;
    maxAllowed: number;
  };
  businesses: Array<{
    id: number;
    businessType: string;
    name: string;
    level: number;
    isOperational: boolean;
  }>;
  unlockableBusinesses: Array<{
    levelNumber: number;
    code: string;
    name: string;
    description: string;
    minXp: number;
    minCash: number;
    isUnlocked: boolean;
    isMvp: boolean;
  }>;
  currentMissions: Array<{
    id: number;
    code: string;
    title: string;
    missionType: string;
    progressValue: number;
    targetValue: number;
    rewardCash: number;
    rewardXp: number;
    status: string;
  }>;
  recentTransactions: Array<{
    id: number;
    transactionType: string;
    category: string;
    amount: number;
    balanceAfter: number;
    description: string | null;
    createdAt: string;
  }>;
  notifications: {
    unreadCount: number;
    items: Array<{
      id: number;
      type: string;
      title: string;
      message: string;
      isRead: boolean;
      createdAt: string;
    }>;
  };
}

export class DashboardRepository {
  async getDashboardData(playerId: number): Promise<DashboardDataDTO> {
    const [profileRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         pp.display_name AS displayName,
         pp.cash_balance AS cashBalance,
         pp.gems_balance AS gemsBalance,
         pp.net_worth AS netWorth,
         pp.reputation,
         pp.max_employees_allowed AS maxEmployeesAllowed,
         pg.xp_level AS xpLevel,
         pg.current_xp AS currentXp,
         gl.level_number AS currentLevelNumber,
         gl.name AS currentLevelName
       FROM player_profiles pp
       INNER JOIN player_progression pg ON pg.player_id = pp.id
       INNER JOIN game_levels gl ON gl.id = pg.current_level_id
       WHERE pp.id = ? AND pp.deleted_at IS NULL
       LIMIT 1`,
      [playerId]
    );

    const p = profileRows[0];
    if (!p) {
      throw new Error('Player profile not found');
    }

    const xpLevel = Number(p.xpLevel ?? 1);
    const nextLevelXp = Math.floor(100 * Math.pow(xpLevel, 1.85));
    const currentBalance = Number(p.cashBalance ?? 0);

    // Daily revenue & expenses (last 24 hours)
    const [finSummaryRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         COALESCE(SUM(CASE WHEN transaction_type IN ('REVENUE', 'REWARD') THEN amount ELSE 0 END), 0) AS dailyRevenue,
         COALESCE(SUM(CASE WHEN transaction_type IN ('EXPENSE', 'CAPEX', 'LOAN_REPAY') THEN amount ELSE 0 END), 0) AS dailyExpenses
       FROM financial_transactions
       WHERE player_id = ? AND created_at >= (UTC_TIMESTAMP() - INTERVAL 24 HOUR)`,
      [playerId]
    );
    const dailyRevenue = Number(finSummaryRows[0]?.dailyRevenue ?? 0);
    const dailyExpenses = Number(finSummaryRows[0]?.dailyExpenses ?? 0);

    // Performance series grouped by 4-hour buckets over last 24h
    const [perfRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         DATE_FORMAT(created_at, '%H:00') AS label,
         COALESCE(SUM(CASE WHEN transaction_type IN ('REVENUE', 'REWARD') THEN amount ELSE 0 END), 0) AS revenue,
         COALESCE(SUM(CASE WHEN transaction_type IN ('EXPENSE', 'CAPEX', 'LOAN_REPAY') THEN amount ELSE 0 END), 0) AS expenses
       FROM financial_transactions
       WHERE player_id = ? AND created_at >= (UTC_TIMESTAMP() - INTERVAL 24 HOUR)
       GROUP BY DATE_FORMAT(created_at, '%H:00')
       ORDER BY MIN(created_at) ASC
       LIMIT 12`,
      [playerId]
    );

    // Active employee count
    const [empRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS activeCount FROM employees WHERE player_id = ? AND deleted_at IS NULL`,
      [playerId]
    );

    // Owned businesses
    const [bizRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT id, business_type AS businessType, name, level, is_operational AS isOperational
       FROM businesses
       WHERE player_id = ? AND deleted_at IS NULL
       ORDER BY id ASC`,
      [playerId]
    );

    // Unlockable business stages from game_levels
    const currentLevelNumber = Number(p.currentLevelNumber ?? 1);
    const [levelRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT level_number AS levelNumber, code, name, description, min_xp AS minXp, min_cash AS minCash, is_mvp AS isMvp
       FROM game_levels
       ORDER BY level_number ASC`
    );

    // Active missions
    const [missionRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         pm.id,
         m.code,
         m.title,
         m.mission_type AS missionType,
         pm.progress_value AS progressValue,
         m.target_value AS targetValue,
         m.reward_cash AS rewardCash,
         m.reward_xp AS rewardXp,
         pm.status
       FROM player_missions pm
       INNER JOIN missions m ON m.id = pm.mission_id
       WHERE pm.player_id = ? AND pm.status IN ('ACTIVE', 'COMPLETED')
       ORDER BY pm.id ASC
       LIMIT 6`,
      [playerId]
    );

    // Recent transactions
    const [txRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         id,
         transaction_type AS transactionType,
         category,
         amount,
         balance_after AS balanceAfter,
         description,
         created_at AS createdAt
       FROM financial_transactions
       WHERE player_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 8`,
      [playerId]
    );

    // Notifications
    const [notifRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT id, type, title, message, is_read AS isRead, created_at AS createdAt
       FROM notifications
       WHERE player_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 10`,
      [playerId]
    );

    const notificationsList = notifRows.map((n) => ({
      id: Number(n.id),
      type: String(n.type),
      title: String(n.title),
      message: String(n.message),
      isRead: Boolean(n.isRead),
      createdAt: new Date(String(n.createdAt)).toISOString(),
    }));

    return {
      profile: {
        displayName: String(p.displayName),
        cashBalance: currentBalance,
        gemsBalance: Number(p.gemsBalance ?? 0),
        netWorth: Number(p.netWorth ?? 0),
        reputation: Number(p.reputation ?? 0),
        maxEmployeesAllowed: Number(p.maxEmployeesAllowed ?? 30),
      },
      progression: {
        currentLevelNumber,
        currentLevelName: String(p.currentLevelName),
        xpLevel,
        currentXp: Number(p.currentXp ?? 0),
        nextLevelXp,
      },
      financials: {
        currentBalance,
        dailyRevenue,
        dailyExpenses,
        netProfit: Number((dailyRevenue - dailyExpenses).toFixed(2)),
        performanceSeries: perfRows.map((r) => ({
          label: String(r.label),
          revenue: Number(r.revenue ?? 0),
          expenses: Number(r.expenses ?? 0),
        })),
      },
      employees: {
        activeCount: Number(empRows[0]?.activeCount ?? 0),
        maxAllowed: Number(p.maxEmployeesAllowed ?? 30),
      },
      businesses: bizRows.map((b) => ({
        id: Number(b.id),
        businessType: String(b.businessType),
        name: String(b.name),
        level: Number(b.level),
        isOperational: Boolean(b.isOperational),
      })),
      unlockableBusinesses: levelRows.map((l) => ({
        levelNumber: Number(l.levelNumber),
        code: String(l.code),
        name: String(l.name),
        description: String(l.description),
        minXp: Number(l.minXp),
        minCash: Number(l.minCash),
        isUnlocked: Number(l.levelNumber) <= currentLevelNumber,
        isMvp: Boolean(l.isMvp),
      })),
      currentMissions: missionRows.map((m) => ({
        id: Number(m.id),
        code: String(m.code),
        title: String(m.title),
        missionType: String(m.missionType),
        progressValue: Number(m.progressValue),
        targetValue: Number(m.targetValue),
        rewardCash: Number(m.rewardCash),
        rewardXp: Number(m.rewardXp),
        status: String(m.status),
      })),
      recentTransactions: txRows.map((t) => ({
        id: Number(t.id),
        transactionType: String(t.transactionType),
        category: String(t.category),
        amount: Number(t.amount),
        balanceAfter: Number(t.balanceAfter),
        description: t.description ? String(t.description) : null,
        createdAt: new Date(String(t.createdAt)).toISOString(),
      })),
      notifications: {
        unreadCount: notificationsList.filter((n) => !n.isRead).length,
        items: notificationsList,
      },
    };
  }

  async markAllNotificationsRead(playerId: number): Promise<void> {
    await dbPool.query(`UPDATE notifications SET is_read = 1 WHERE player_id = ? AND is_read = 0`, [
      playerId,
    ]);
  }
}
