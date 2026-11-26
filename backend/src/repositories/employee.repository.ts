import { RowDataPacket } from 'mysql2/promise';
import { dbPool } from '../database/pool';
import {
  EmployeeDepartment,
  EmployeeRole,
  GLOBAL_MAX_EMPLOYEES,
  PROMOTION_MAP,
} from '../utils/employeeCalculator';

export interface EmployeeListQuery {
  page: number;
  limit: number;
  department?: EmployeeDepartment;
  status?: string;
  businessId?: number;
  search?: string;
}

export interface EmployeeDTO {
  id: number;
  fullName: string;
  department: EmployeeDepartment;
  role: EmployeeRole;
  skillLevel: number;
  experience: number;
  productivity: number;
  happiness: number;
  hourlyWage: number;
  isShiftLead: boolean;
  employmentStatus: string;
  assignedBusinessId: number | null;
  assignedBusinessName: string | null;
  hiredAt: string;
  canPromoteTo: EmployeeRole | null;
  promotionMinSkill: number | null;
}

export interface EmployeesDashboardDTO {
  summary: {
    activeCount: number;
    maxGlobalCap: number;
    totalHourlyPayroll: number;
    avgHappiness: number;
    avgProductivity: number;
    cashBalance: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  employees: EmployeeDTO[];
  departmentStats: Array<{
    department: EmployeeDepartment;
    headcount: number;
    totalHourlyPayroll: number;
    avgHappiness: number;
    avgSkill: number;
  }>;
  businesses: Array<{
    id: number;
    name: string;
    businessType: string;
    assignedCount: number;
    maxEmployees: number;
  }>;
}

export class EmployeeRepository {
  async getEmployeesDashboard(
    playerId: number,
    query: EmployeeListQuery
  ): Promise<EmployeesDashboardDTO> {
    const [playerRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT cash_balance AS cashBalance FROM player_profiles WHERE id = ? LIMIT 1`,
      [playerId]
    );
    const cashBalance = Number(playerRows[0]?.cashBalance ?? 0);

    // Global summary
    const [sumRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         COUNT(*) AS activeCount,
         COALESCE(SUM(hourly_wage), 0) AS totalHourlyPayroll,
         COALESCE(AVG(happiness), 0) AS avgHappiness,
         COALESCE(AVG(productivity_multiplier), 0) AS avgProductivity
       FROM employees
       WHERE player_id = ? AND deleted_at IS NULL`,
      [playerId]
    );

    // Department stats
    const [deptRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         department,
         COUNT(*) AS headcount,
         COALESCE(SUM(hourly_wage), 0) AS totalHourlyPayroll,
         COALESCE(AVG(happiness), 0) AS avgHappiness,
         COALESCE(AVG(skill_level), 0) AS avgSkill
       FROM employees
       WHERE player_id = ? AND deleted_at IS NULL
       GROUP BY department`,
      [playerId]
    );

    // Businesses with assigned counts
    const [bizRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         b.id, b.name, b.business_type AS businessType, b.max_employees AS maxEmployees,
         COUNT(ea.id) AS assignedCount
       FROM businesses b
       LEFT JOIN employee_assignments ea ON ea.business_id = b.id AND ea.active_flag = 1
       WHERE b.player_id = ? AND b.deleted_at IS NULL
       GROUP BY b.id, b.name, b.business_type, b.max_employees
       ORDER BY b.id ASC`,
      [playerId]
    );

    // Filtered & paginated employee list
    const whereClauses: string[] = ['e.player_id = ?', 'e.deleted_at IS NULL'];
    const params: unknown[] = [playerId];

    if (query.department) {
      whereClauses.push('e.department = ?');
      params.push(query.department);
    }
    if (query.status) {
      whereClauses.push('e.employment_status = ?');
      params.push(query.status);
    }
    if (query.businessId) {
      whereClauses.push('ea.business_id = ?');
      params.push(query.businessId);
    }
    if (query.search) {
      whereClauses.push('e.full_name LIKE ?');
      params.push(`%${query.search}%`);
    }

    const whereSql = whereClauses.join(' AND ');

    const [countRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
       FROM employees e
       LEFT JOIN employee_assignments ea ON ea.employee_id = e.id AND ea.active_flag = 1
       WHERE ${whereSql}`,
      params
    );
    const total = Number(countRows[0]?.total ?? 0);
    const offset = (query.page - 1) * query.limit;

    const [empRows] = await dbPool.query<RowDataPacket[]>(
      `SELECT
         e.id, e.full_name AS fullName, e.department, e.role,
         e.skill_level AS skillLevel, e.experience,
         e.productivity_multiplier AS productivity, e.happiness,
         e.hourly_wage AS hourlyWage, e.is_shift_lead AS isShiftLead,
         e.employment_status AS employmentStatus, e.hired_at AS hiredAt,
         ea.business_id AS assignedBusinessId, b.name AS assignedBusinessName
       FROM employees e
       LEFT JOIN employee_assignments ea ON ea.employee_id = e.id AND ea.active_flag = 1
       LEFT JOIN businesses b ON b.id = ea.business_id
       WHERE ${whereSql}
       ORDER BY e.id DESC
       LIMIT ? OFFSET ?`,
      [...params, query.limit, offset]
    );

    return {
      summary: {
        activeCount: Number(sumRows[0]?.activeCount ?? 0),
        maxGlobalCap: GLOBAL_MAX_EMPLOYEES,
        totalHourlyPayroll: Number(sumRows[0]?.totalHourlyPayroll ?? 0),
        avgHappiness: Math.round(Number(sumRows[0]?.avgHappiness ?? 0)),
        avgProductivity: Number(Number(sumRows[0]?.avgProductivity ?? 0).toFixed(2)),
        cashBalance,
      },
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
      employees: empRows.map((e) => {
        const role = e.role as EmployeeRole;
        const promo = PROMOTION_MAP[role];
        return {
          id: Number(e.id),
          fullName: String(e.fullName),
          department: e.department as EmployeeDepartment,
          role,
          skillLevel: Number(e.skillLevel),
          experience: Number(e.experience),
          productivity: Number(e.productivity),
          happiness: Number(e.happiness),
          hourlyWage: Number(e.hourlyWage),
          isShiftLead: Boolean(e.isShiftLead),
          employmentStatus: String(e.employmentStatus),
          assignedBusinessId: e.assignedBusinessId ? Number(e.assignedBusinessId) : null,
          assignedBusinessName: e.assignedBusinessName ? String(e.assignedBusinessName) : null,
          hiredAt: new Date(String(e.hiredAt)).toISOString(),
          canPromoteTo: promo ? promo.nextRole : null,
          promotionMinSkill: promo ? promo.minSkill : null,
        };
      }),
      departmentStats: deptRows.map((d) => ({
        department: d.department as EmployeeDepartment,
        headcount: Number(d.headcount),
        totalHourlyPayroll: Number(d.totalHourlyPayroll),
        avgHappiness: Math.round(Number(d.avgHappiness)),
        avgSkill: Number(Number(d.avgSkill).toFixed(1)),
      })),
      businesses: bizRows.map((b) => ({
        id: Number(b.id),
        name: String(b.name),
        businessType: String(b.businessType),
        assignedCount: Number(b.assignedCount),
        maxEmployees: Number(b.maxEmployees),
      })),
    };
  }
}
