export type EmployeeDepartment =
  | 'FARMING'
  | 'PRODUCTION'
  | 'RESTAURANT'
  | 'DELIVERY'
  | 'RETAIL'
  | 'LOGISTICS'
  | 'MANAGEMENT'
  | 'CORPORATE';

export type EmployeeRole =
  | 'FARMHAND'
  | 'AGRONOMIST'
  | 'PREP_COOK'
  | 'PIZZA_CHEF'
  | 'CASHIER'
  | 'STORE_MANAGER'
  | 'FACTORY_WORKER'
  | 'QUALITY_INSPECTOR'
  | 'MAINTENANCE_TECH'
  | 'DELIVERY_DRIVER'
  | 'FLEET_DISPATCHER'
  | 'LOGISTICS_COORDINATOR'
  | 'RETAIL_CLERK'
  | 'REGIONAL_DIRECTOR'
  | 'EXECUTIVE';

export const GLOBAL_MAX_EMPLOYEES = 500;

export const PROMOTION_MAP: Partial<
  Record<
    EmployeeRole,
    {
      nextRole: EmployeeRole;
      minSkill: number;
      minHappiness: number;
      wageMultiplier: number;
      department?: EmployeeDepartment;
    }
  >
> = {
  FARMHAND: { nextRole: 'AGRONOMIST', minSkill: 3, minHappiness: 50, wageMultiplier: 1.35 },
  PREP_COOK: { nextRole: 'PIZZA_CHEF', minSkill: 2, minHappiness: 50, wageMultiplier: 1.3 },
  PIZZA_CHEF: {
    nextRole: 'STORE_MANAGER',
    minSkill: 5,
    minHappiness: 60,
    wageMultiplier: 1.5,
    department: 'MANAGEMENT',
  },
  CASHIER: {
    nextRole: 'STORE_MANAGER',
    minSkill: 4,
    minHappiness: 60,
    wageMultiplier: 1.45,
    department: 'MANAGEMENT',
  },
  FACTORY_WORKER: {
    nextRole: 'QUALITY_INSPECTOR',
    minSkill: 3,
    minHappiness: 50,
    wageMultiplier: 1.35,
  },
  DELIVERY_DRIVER: {
    nextRole: 'FLEET_DISPATCHER',
    minSkill: 3,
    minHappiness: 50,
    wageMultiplier: 1.35,
    department: 'LOGISTICS',
  },
  STORE_MANAGER: {
    nextRole: 'REGIONAL_DIRECTOR',
    minSkill: 7,
    minHappiness: 70,
    wageMultiplier: 1.6,
    department: 'CORPORATE',
  },
  REGIONAL_DIRECTOR: {
    nextRole: 'EXECUTIVE',
    minSkill: 9,
    minHappiness: 75,
    wageMultiplier: 1.8,
    department: 'CORPORATE',
  },
};

export function calculateTrainingCost(currentSkillLevel: number): number {
  return Math.floor(100 * Math.pow(1.45, Math.max(0, currentSkillLevel - 1)));
}

export function calculateHiringFee(hourlyWage: number, skillLevel: number): number {
  return Math.round(hourlyWage * 4 + skillLevel * 25);
}

export function calculateSalaryHappinessDelta(oldWage: number, newWage: number): number {
  if (oldWage <= 0) return 0;
  const pctChange = (newWage - oldWage) / oldWage;
  return Math.round(pctChange * 40); // +10% raise -> +4 happiness; -10% cut -> -4 happiness
}
