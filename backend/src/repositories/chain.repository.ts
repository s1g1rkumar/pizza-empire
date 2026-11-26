import { RowDataPacket } from 'mysql2/promise';
import { dbPool } from '../database/pool';

export interface ChainBranchDTO {
  restaurantId: number;
  businessId: number;
  name: string;
  restaurantType: string;
  locationName: string;
  districtType: string;
  demandMultiplier: number;
  rentMultiplier: number;
  monthlyRent: number;
  managerEmployeeId: number | null;
  managerName: string | null;
  staffCount: number;
  avgRating: number;
  revenue24h: number;
  expenses24h: number;
  netProfit24h: number;
}

export interface ChainDashboardDTO {
  cashBalance: number;
  summary: {
    totalBranches: number;
    totalRevenue24h: number;
    totalExpenses24h: number;
    totalNetProfit24h: number;
    totalMonthlyRent: number;
    avgChainRating: number;
    topBranchName: string | null;
  };
  locations: Array<{
    id: number;
    code: string;
    name: string;
    districtType: string;
    demandMultiplier: number;
    rentMultiplier: number;
    priceElasticity: number;
  }>;
  availableManagers: Array<{
    id: number;
    fullName: string;
    role: string;
    skillLevel: number;
  }>;
  branches: ChainBranchDTO[];
}

export class ChainRepository {
  async getChainDashboard(playerId: number): Promise<ChainDashboardDTO> {
    const [pRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT cash_balance AS cashBalance FROM player_profiles WHERE id = ? LIMIT 1`,
      [playerId]
    );
    const cashBalance = Number(pRows[0]?.cashBalance ?? 0);

    const [locRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT id, code, name, district_type AS districtType,
              demand_multiplier AS demandMultiplier, rent_multiplier AS rentMultiplier,
              price_elasticity AS priceElasticity
       FROM locations
       WHERE code LIKE 'LOC_%'
       ORDER BY demand_multiplier DESC, id ASC`
    );

    const [mgrRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT id, full_name AS fullName, role, skill_level AS skillLevel
       FROM employees
       WHERE player_id = ? AND deleted_at IS NULL AND (role = 'STORE_MANAGER' OR department = 'MANAGEMENT' OR is_shift_lead = 1)
       ORDER BY skill_level DESC`,
      [playerId]
    );

    const [branchRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         r.id AS restaurantId, r.business_id AS businessId, b.name,
         r.restaurant_type AS restaurantType, l.name AS locationName, l.district_type AS districtType,
         l.demand_multiplier AS demandMultiplier, l.rent_multiplier AS rentMultiplier,
         r.monthly_rent AS monthlyRent, r.manager_employee_id AS managerEmployeeId,
         mgr.full_name AS managerName, r.avg_rating AS avgRating,
         (SELECT COUNT(*) FROM employee_assignments ea WHERE ea.business_id = b.id AND ea.active_flag = 1) AS staffCount,
         COALESCE((SELECT SUM(ft.amount) FROM financial_transactions ft WHERE ft.business_id = b.id AND ft.transaction_type = 'REVENUE' AND ft.created_at >= (UTC_TIMESTAMP() - INTERVAL 24 HOUR)), 0) AS revenue24h,
         COALESCE((SELECT SUM(ft.amount) FROM financial_transactions ft WHERE ft.business_id = b.id AND ft.transaction_type IN ('EXPENSE', 'CAPEX') AND ft.created_at >= (UTC_TIMESTAMP() - INTERVAL 24 HOUR)), 0) AS expenses24h
       FROM restaurants r
       INNER JOIN businesses b ON b.id = r.business_id
       INNER JOIN locations l ON l.id = b.location_id
       LEFT JOIN employees mgr ON mgr.id = r.manager_employee_id
       WHERE r.player_id = ? AND r.deleted_at IS NULL AND b.deleted_at IS NULL
       ORDER BY revenue24h DESC, r.id ASC`,
      [playerId]
    );

    const branches: ChainBranchDTO[] = branchRows.map((b) => {
      const rev = Number(b.revenue24h ?? 0);
      const exp = Number(b.expenses24h ?? 0);
      return {
        restaurantId: Number(b.restaurantId),
        businessId: Number(b.businessId),
        name: String(b.name),
        restaurantType: String(b.restaurantType),
        locationName: String(b.locationName),
        districtType: String(b.districtType),
        demandMultiplier: Number(b.demandMultiplier),
        rentMultiplier: Number(b.rentMultiplier),
        monthlyRent: Number(b.monthlyRent),
        managerEmployeeId: b.managerEmployeeId ? Number(b.managerEmployeeId) : null,
        managerName: b.managerName ? String(b.managerName) : null,
        staffCount: Number(b.staffCount ?? 0),
        avgRating: Number(b.avgRating ?? 4.0),
        revenue24h: rev,
        expenses24h: exp,
        netProfit24h: Number((rev - exp).toFixed(2)),
      };
    });

    const totalRevenue24h = branches.reduce((s, b) => s + b.revenue24h, 0);
    const totalExpenses24h = branches.reduce((s, b) => s + b.expenses24h, 0);
    const totalMonthlyRent = branches.reduce((s, b) => s + b.monthlyRent, 0);
    const avgChainRating =
      branches.length > 0
        ? Number((branches.reduce((s, b) => s + b.avgRating, 0) / branches.length).toFixed(2))
        : 0;

    return {
      cashBalance,
      summary: {
        totalBranches: branches.length,
        totalRevenue24h: Number(totalRevenue24h.toFixed(2)),
        totalExpenses24h: Number(totalExpenses24h.toFixed(2)),
        totalNetProfit24h: Number((totalRevenue24h - totalExpenses24h).toFixed(2)),
        totalMonthlyRent: Number(totalMonthlyRent.toFixed(2)),
        avgChainRating,
        topBranchName: branches[0]?.name ?? null,
      },
      locations: locRows.map((l) => ({
        id: Number(l.id),
        code: String(l.code),
        name: String(l.name),
        districtType: String(l.districtType),
        demandMultiplier: Number(l.demandMultiplier),
        rentMultiplier: Number(l.rentMultiplier),
        priceElasticity: Number(l.priceElasticity),
      })),
      availableManagers: mgrRows.map((m) => ({
        id: Number(m.id),
        fullName: String(m.fullName),
        role: String(m.role),
        skillLevel: Number(m.skillLevel),
      })),
      branches,
    };
  }
}
