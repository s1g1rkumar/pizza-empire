export type EmployeeDepartment =
  | 'FARMING'
  | 'PRODUCTION'
  | 'RESTAURANT'
  | 'DELIVERY'
  | 'RETAIL'
  | 'LOGISTICS'
  | 'MANAGEMENT'
  | 'CORPORATE';

export interface EmployeeDTO {
  id: number;
  fullName: string;
  department: EmployeeDepartment;
  role: string;
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
  canPromoteTo: string | null;
  promotionMinSkill: number | null;
}

export interface CandidateDTO {
  tempId: string;
  fullName: string;
  department: EmployeeDepartment;
  role: string;
  skillLevel: number;
  hourlyWage: number;
  hiringFee: number;
}

export interface EmployeesDashboardData {
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
