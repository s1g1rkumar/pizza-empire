import { apiClient } from './apiClient';
import { ApiResponse } from '@/types/api.types';
import { CandidateDTO, EmployeeDepartment, EmployeesDashboardData } from '@/types/employee.types';

export interface EmployeeQueryParams {
  page?: number;
  limit?: number;
  department?: EmployeeDepartment | '';
  status?: string;
  businessId?: number | '';
  search?: string;
}

export const employeeService = {
  async getDashboard(params: EmployeeQueryParams = {}): Promise<EmployeesDashboardData> {
    const cleanParams: Record<string, string | number> = {
      page: params.page ?? 1,
      limit: params.limit ?? 15,
    };
    if (params.department) cleanParams.department = params.department;
    if (params.status) cleanParams.status = params.status;
    if (params.businessId) cleanParams.businessId = params.businessId;
    if (params.search) cleanParams.search = params.search;

    const res = await apiClient.get<ApiResponse<EmployeesDashboardData>>('/employees', {
      params: cleanParams,
    });
    return res.data.data;
  },

  async getCandidates(): Promise<CandidateDTO[]> {
    const res = await apiClient.get<ApiResponse<CandidateDTO[]>>('/employees/candidates');
    return res.data.data;
  },

  async hire(payload: {
    fullName: string;
    department: EmployeeDepartment;
    role: string;
    skillLevel: number;
    hourlyWage: number;
    businessId?: number;
  }): Promise<void> {
    await apiClient.post('/employees/hire', payload);
  },

  async assign(
    employeeId: number,
    businessId: number,
    department?: EmployeeDepartment
  ): Promise<void> {
    await apiClient.post(`/employees/${employeeId}/assign`, { businessId, department });
  },

  async train(employeeId: number): Promise<void> {
    await apiClient.post(`/employees/${employeeId}/train`);
  },

  async promote(employeeId: number): Promise<void> {
    await apiClient.post(`/employees/${employeeId}/promote`);
  },

  async updateSalary(employeeId: number, hourlyWage: number): Promise<void> {
    await apiClient.patch(`/employees/${employeeId}/salary`, { hourlyWage });
  },

  async fire(employeeId: number): Promise<void> {
    await apiClient.post(`/employees/${employeeId}/fire`);
  },

  async runPayroll(): Promise<{ totalPaid: number; employeeCount: number }> {
    const res =
      await apiClient.post<ApiResponse<{ totalPaid: number; employeeCount: number }>>(
        '/employees/payroll/run'
      );
    return res.data.data;
  },
};
