import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from '../database/pool';
import {
  EmployeeListQuery,
  EmployeeRepository,
  EmployeesDashboardDTO,
} from '../repositories/employee.repository';
import { AppError, ConflictError, NotFoundError } from '../utils/errors';
import {
  calculateHiringFee,
  calculateSalaryHappinessDelta,
  calculateTrainingCost,
  EmployeeDepartment,
  EmployeeRole,
  GLOBAL_MAX_EMPLOYEES,
  PROMOTION_MAP,
} from '../utils/employeeCalculator';
import { EconomyService } from './economy.service';

export interface CandidateDTO {
  tempId: string;
  fullName: string;
  department: EmployeeDepartment;
  role: EmployeeRole;
  skillLevel: number;
  hourlyWage: number;
  hiringFee: number;
}

const SAMPLE_FIRST_NAMES = ['Marco', 'Elena', 'Lucas', 'Sofia', 'Mateo', 'Aria', 'Leo', 'Nina'];
const SAMPLE_LAST_NAMES = ['Rossi', 'Bianchi', 'Conti', 'Moretti', 'Esposito', 'Romano', 'Ricci'];

const DEPT_DEFAULT_ROLES: Array<{
  department: EmployeeDepartment;
  role: EmployeeRole;
  baseWage: number;
}> = [
  { department: 'FARMING', role: 'FARMHAND', baseWage: 12 },
  { department: 'PRODUCTION', role: 'FACTORY_WORKER', baseWage: 16 },
  { department: 'RESTAURANT', role: 'PIZZA_CHEF', baseWage: 18 },
  { department: 'RESTAURANT', role: 'CASHIER', baseWage: 13 },
  { department: 'DELIVERY', role: 'DELIVERY_DRIVER', baseWage: 14 },
  { department: 'RETAIL', role: 'RETAIL_CLERK', baseWage: 14 },
  { department: 'LOGISTICS', role: 'LOGISTICS_COORDINATOR', baseWage: 20 },
  { department: 'MANAGEMENT', role: 'STORE_MANAGER', baseWage: 28 },
  { department: 'CORPORATE', role: 'EXECUTIVE', baseWage: 45 },
];

export class EmployeeService {
  private readonly employeeRepo = new EmployeeRepository();
  private readonly economyService = new EconomyService();

  async getDashboard(playerId: number, query: EmployeeListQuery): Promise<EmployeesDashboardDTO> {
    return this.employeeRepo.getEmployeesDashboard(playerId, query);
  }

  generateRecruitmentPool(): CandidateDTO[] {
    return DEPT_DEFAULT_ROLES.map((tpl, idx) => {
      const first =
        SAMPLE_FIRST_NAMES[(idx + Math.floor(Math.random() * 8)) % SAMPLE_FIRST_NAMES.length]!;
      const last =
        SAMPLE_LAST_NAMES[(idx * 3 + Math.floor(Math.random() * 7)) % SAMPLE_LAST_NAMES.length]!;
      const skillLevel = 1 + (idx % 3);
      const hourlyWage = Number((tpl.baseWage * (1 + (skillLevel - 1) * 0.15)).toFixed(2));
      return {
        tempId: `${tpl.role}_${idx}_${Date.now()}`,
        fullName: `${first} ${last}`,
        department: tpl.department,
        role: tpl.role,
        skillLevel,
        hourlyWage,
        hiringFee: calculateHiringFee(hourlyWage, skillLevel),
      };
    });
  }

  async hireEmployee(
    playerId: number,
    input: {
      fullName: string;
      department: EmployeeDepartment;
      role: EmployeeRole;
      skillLevel: number;
      hourlyWage: number;
      businessId?: number;
    }
  ): Promise<number> {
    return withTransaction(async (conn) => {
      // Lock player profile and enforce 500-employee global cap
      const [cntRows] = await conn.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS activeCount
         FROM employees
         WHERE player_id = ? AND deleted_at IS NULL
         FOR UPDATE`,
        [playerId]
      );
      const currentCount = Number(cntRows[0]?.activeCount ?? 0);
      if (currentCount >= GLOBAL_MAX_EMPLOYEES) {
        throw new AppError(
          `Global workforce limit reached (${GLOBAL_MAX_EMPLOYEES}/${GLOBAL_MAX_EMPLOYEES} employees)`,
          422,
          'MAX_EMPLOYEES_REACHED'
        );
      }

      if (input.businessId) {
        const [bizRows] = await conn.query<RowDataPacket[]>(
          `SELECT b.id, b.max_employees AS maxEmployees, COUNT(ea.id) AS assignedCount
           FROM businesses b
           LEFT JOIN employee_assignments ea ON ea.business_id = b.id AND ea.active_flag = 1
           WHERE b.id = ? AND b.player_id = ? AND b.deleted_at IS NULL
           GROUP BY b.id, b.max_employees
           FOR UPDATE`,
          [input.businessId, playerId]
        );
        const biz = bizRows[0];
        if (!biz) throw new NotFoundError('Target business not found');
        if (Number(biz.assignedCount) >= Number(biz.maxEmployees)) {
          throw new ConflictError(
            `Business staff capacity full (${biz.assignedCount}/${biz.maxEmployees})`
          );
        }
      }

      const hiringFee = calculateHiringFee(input.hourlyWage, input.skillLevel);
      await this.economyService.recordCashTransaction(conn, {
        playerId,
        businessId: input.businessId ?? null,
        transactionType: 'EXPENSE',
        category: 'PAYROLL',
        amount: hiringFee,
        isCredit: false,
        description: `Hired ${input.fullName} (${input.role})`,
      });

      const productivity = this.economyService.calculateEmployeeProductivity({
        skillLevel: input.skillLevel,
        happiness: 85,
        hourlyWage: input.hourlyWage,
        isShiftLead: false,
      });

      const [empRes] = await conn.query<ResultSetHeader>(
        `INSERT INTO employees
           (player_id, full_name, department, role, skill_level, experience, productivity_multiplier, happiness, hourly_wage, employment_status)
         VALUES (?, ?, ?, ?, ?, 0, ?, 85, ?, 'ACTIVE')`,
        [
          playerId,
          input.fullName.trim(),
          input.department,
          input.role,
          input.skillLevel,
          productivity,
          input.hourlyWage,
        ]
      );
      const employeeId = empRes.insertId;

      if (input.businessId) {
        await conn.query(
          `INSERT INTO employee_assignments (player_id, employee_id, business_id, active_flag)
           VALUES (?, ?, ?, 1)`,
          [playerId, employeeId, input.businessId]
        );
      }

      return employeeId;
    });
  }

  async assignEmployee(
    playerId: number,
    employeeId: number,
    businessId: number,
    department?: EmployeeDepartment
  ): Promise<void> {
    await withTransaction(async (conn) => {
      const [empRows] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM employees WHERE id = ? AND player_id = ? AND deleted_at IS NULL FOR UPDATE`,
        [employeeId, playerId]
      );
      if (!empRows[0]) throw new NotFoundError('Employee not found');

      const [bizRows] = await conn.query<RowDataPacket[]>(
        `SELECT b.id, b.max_employees AS maxEmployees, COUNT(ea.id) AS assignedCount
         FROM businesses b
         LEFT JOIN employee_assignments ea ON ea.business_id = b.id AND ea.active_flag = 1
         WHERE b.id = ? AND b.player_id = ? AND b.deleted_at IS NULL
         GROUP BY b.id, b.max_employees
         FOR UPDATE`,
        [businessId, playerId]
      );
      const biz = bizRows[0];
      if (!biz) throw new NotFoundError('Business not found');
      if (Number(biz.assignedCount) >= Number(biz.maxEmployees)) {
        throw new ConflictError(
          `Business capacity reached (${biz.assignedCount}/${biz.maxEmployees})`
        );
      }

      // Deactivate previous assignment (sets active_flag = NULL so UNIQUE constraint allows history)
      await conn.query(
        `UPDATE employee_assignments
         SET active_flag = NULL, unassigned_at = UTC_TIMESTAMP()
         WHERE employee_id = ? AND active_flag = 1`,
        [employeeId]
      );

      await conn.query(
        `INSERT INTO employee_assignments (player_id, employee_id, business_id, active_flag)
         VALUES (?, ?, ?, 1)`,
        [playerId, employeeId, businessId]
      );

      if (department) {
        await conn.query(`UPDATE employees SET department = ? WHERE id = ?`, [
          department,
          employeeId,
        ]);
      }
    });
  }

  async trainEmployee(playerId: number, employeeId: number): Promise<void> {
    await withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT id, full_name AS fullName, skill_level AS skillLevel, happiness, hourly_wage AS hourlyWage, is_shift_lead AS isShiftLead
         FROM employees WHERE id = ? AND player_id = ? AND deleted_at IS NULL FOR UPDATE`,
        [employeeId, playerId]
      );
      const emp = rows[0];
      if (!emp) throw new NotFoundError('Employee not found');

      const currentSkill = Number(emp.skillLevel);
      if (currentSkill >= 10) throw new ConflictError('Employee is already at max Skill Level 10');

      const cost = calculateTrainingCost(currentSkill);
      await this.economyService.recordCashTransaction(conn, {
        playerId,
        transactionType: 'EXPENSE',
        category: 'TRAINING',
        amount: cost,
        isCredit: false,
        description: `Trained ${String(emp.fullName)} to Skill Lv ${currentSkill + 1}`,
      });

      const nextSkill = currentSkill + 1;
      const nextProd = this.economyService.calculateEmployeeProductivity({
        skillLevel: nextSkill,
        happiness: Number(emp.happiness),
        hourlyWage: Number(emp.hourlyWage),
        isShiftLead: Boolean(emp.isShiftLead),
      });

      await conn.query(
        `UPDATE employees
         SET skill_level = ?, experience = experience + 100, productivity_multiplier = ?
         WHERE id = ?`,
        [nextSkill, nextProd, employeeId]
      );
    });
  }

  async promoteEmployee(playerId: number, employeeId: number): Promise<void> {
    await withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT id, role, department, skill_level AS skillLevel, happiness, hourly_wage AS hourlyWage
         FROM employees WHERE id = ? AND player_id = ? AND deleted_at IS NULL FOR UPDATE`,
        [employeeId, playerId]
      );
      const emp = rows[0];
      if (!emp) throw new NotFoundError('Employee not found');

      const promo = PROMOTION_MAP[emp.role as EmployeeRole];
      if (!promo) throw new ConflictError('This role cannot be promoted further');

      if (Number(emp.skillLevel) < promo.minSkill) {
        throw new AppError(
          `Requires Skill Level ${promo.minSkill} to promote to ${promo.nextRole}`,
          422,
          'PROMOTION_REQUIREMENT_UNMET'
        );
      }
      if (Number(emp.happiness) < promo.minHappiness) {
        throw new AppError(
          `Requires ${promo.minHappiness}% happiness to promote`,
          422,
          'PROMOTION_REQUIREMENT_UNMET'
        );
      }

      const nextWage = Number((Number(emp.hourlyWage) * promo.wageMultiplier).toFixed(2));
      const nextHappiness = Math.min(100, Number(emp.happiness) + 10);
      const nextDept = promo.department ?? (emp.department as EmployeeDepartment);
      const nextProd = this.economyService.calculateEmployeeProductivity({
        skillLevel: Number(emp.skillLevel),
        happiness: nextHappiness,
        hourlyWage: nextWage,
        isShiftLead: true,
      });

      await conn.query(
        `UPDATE employees
         SET role = ?, department = ?, hourly_wage = ?, happiness = ?, is_shift_lead = 1,
             experience = experience + 250, productivity_multiplier = ?
         WHERE id = ?`,
        [promo.nextRole, nextDept, nextWage, nextHappiness, nextProd, employeeId]
      );
    });
  }

  async updateSalary(playerId: number, employeeId: number, newWage: number): Promise<void> {
    await withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT id, hourly_wage AS hourlyWage, happiness, skill_level AS skillLevel, is_shift_lead AS isShiftLead
         FROM employees WHERE id = ? AND player_id = ? AND deleted_at IS NULL FOR UPDATE`,
        [employeeId, playerId]
      );
      const emp = rows[0];
      if (!emp) throw new NotFoundError('Employee not found');

      const delta = calculateSalaryHappinessDelta(Number(emp.hourlyWage), newWage);
      const nextHappiness = Math.max(0, Math.min(100, Number(emp.happiness) + delta));
      const nextStatus = nextHappiness < 20 ? 'STRIKING' : 'ACTIVE';
      const nextProd = this.economyService.calculateEmployeeProductivity({
        skillLevel: Number(emp.skillLevel),
        happiness: nextHappiness,
        hourlyWage: newWage,
        isShiftLead: Boolean(emp.isShiftLead),
      });

      await conn.query(
        `UPDATE employees
         SET hourly_wage = ?, happiness = ?, employment_status = ?, productivity_multiplier = ?
         WHERE id = ?`,
        [newWage, nextHappiness, nextStatus, nextProd, employeeId]
      );
    });
  }

  async fireEmployee(playerId: number, employeeId: number): Promise<void> {
    await withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM employees WHERE id = ? AND player_id = ? AND deleted_at IS NULL FOR UPDATE`,
        [employeeId, playerId]
      );
      if (!rows[0]) throw new NotFoundError('Employee not found');

      await conn.query(
        `UPDATE employee_assignments
         SET active_flag = NULL, unassigned_at = UTC_TIMESTAMP()
         WHERE employee_id = ? AND active_flag = 1`,
        [employeeId]
      );

      await conn.query(
        `UPDATE employees
         SET employment_status = 'TERMINATED', deleted_at = UTC_TIMESTAMP()
         WHERE id = ?`,
        [employeeId]
      );
    });
  }

  async runPayroll(playerId: number): Promise<{ totalPaid: number; employeeCount: number }> {
    return withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT COALESCE(SUM(hourly_wage), 0) AS totalPayroll, COUNT(*) AS cnt
         FROM employees
         WHERE player_id = ? AND deleted_at IS NULL AND employment_status = 'ACTIVE'`,
        [playerId]
      );
      const totalPaid = Number(rows[0]?.totalPayroll ?? 0);
      const employeeCount = Number(rows[0]?.cnt ?? 0);

      if (totalPaid > 0) {
        await this.economyService.recordCashTransaction(conn, {
          playerId,
          transactionType: 'EXPENSE',
          category: 'PAYROLL',
          amount: totalPaid,
          isCredit: false,
          description: `Hourly payroll for ${employeeCount} active employee(s)`,
        });
      }

      return { totalPaid, employeeCount };
    });
  }
}
