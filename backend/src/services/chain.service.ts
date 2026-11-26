import { RowDataPacket } from 'mysql2/promise';
import { withTransaction } from '../database/pool';
import { ChainDashboardDTO, ChainRepository } from '../repositories/chain.repository';
import { ConflictError, NotFoundError } from '../utils/errors';
import { EconomyService } from './economy.service';

export class ChainService {
  private readonly chainRepo = new ChainRepository();
  private readonly economyService = new EconomyService();

  async getDashboard(playerId: number): Promise<ChainDashboardDTO> {
    return this.chainRepo.getChainDashboard(playerId);
  }

  async assignManager(
    playerId: number,
    restaurantId: number,
    managerEmployeeId: number
  ): Promise<ChainDashboardDTO> {
    await withTransaction(async (conn) => {
      const [restRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, business_id AS businessId FROM restaurants WHERE id = ? AND player_id = ? AND deleted_at IS NULL FOR UPDATE`,
        [restaurantId, playerId]
      );
      if (!restRows[0]) throw new NotFoundError('Restaurant branch not found');

      const [empRows] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM employees WHERE id = ? AND player_id = ? AND deleted_at IS NULL FOR UPDATE`,
        [managerEmployeeId, playerId]
      );
      if (!empRows[0]) throw new NotFoundError('Manager employee not found');

      await conn.query(`UPDATE restaurants SET manager_employee_id = ? WHERE id = ?`, [
        managerEmployeeId,
        restaurantId,
      ]);
    });

    return this.chainRepo.getChainDashboard(playerId);
  }

  async payBranchRent(playerId: number, restaurantId: number): Promise<ChainDashboardDTO> {
    await withTransaction(async (conn) => {
      const [restRows] = await conn.query<RowDataPacket[]>(
        `SELECT r.id, r.business_id AS businessId, r.monthly_rent AS monthlyRent, b.name
         FROM restaurants r
         INNER JOIN businesses b ON b.id = r.business_id
         WHERE r.id = ? AND r.player_id = ? AND r.deleted_at IS NULL
         FOR UPDATE`,
        [restaurantId, playerId]
      );
      const branch = restRows[0];
      if (!branch) throw new NotFoundError('Restaurant branch not found');

      const monthKey = new Date().toISOString().slice(0, 7);
      const txResult = await this.economyService.recordCashTransaction(conn, {
        playerId,
        businessId: Number(branch.businessId),
        transactionType: 'EXPENSE',
        category: 'RENT',
        amount: Number(branch.monthlyRent),
        isCredit: false,
        referenceId: `branch_rent_${restaurantId}_${monthKey}`,
        description: `Paid branch rent for ${String(branch.name)} (${monthKey})`,
      });
      if (txResult.skippedDuplicate) {
        throw new ConflictError(`Branch rent for ${monthKey} has already been paid`);
      }
    });

    return this.chainRepo.getChainDashboard(playerId);
  }
}
