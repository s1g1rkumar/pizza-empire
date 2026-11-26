import { DashboardDataDTO, DashboardRepository } from '../repositories/dashboard.repository';

export class DashboardService {
  private readonly dashboardRepository = new DashboardRepository();

  async getDashboard(playerId: number): Promise<DashboardDataDTO> {
    return this.dashboardRepository.getDashboardData(playerId);
  }

  async markNotificationsRead(playerId: number): Promise<void> {
    await this.dashboardRepository.markAllNotificationsRead(playerId);
  }
}
