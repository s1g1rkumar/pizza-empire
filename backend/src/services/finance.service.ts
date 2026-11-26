import { RowDataPacket } from 'mysql2/promise';
import { withTransaction } from '../database/pool';
import { FinanceDashboardDTO, FinanceRepository } from '../repositories/finance.repository';
import { EconomyService, TransactionCategory } from './economy.service';

export class FinanceService {
  private readonly financeRepo = new FinanceRepository();
  private readonly economyService = new EconomyService();

  async getDashboard(
    playerId: number,
    filters?: { transactionType?: string; category?: string }
  ): Promise<FinanceDashboardDTO> {
    return this.financeRepo.getFinanceDashboard(playerId, filters);
  }

  /**
   * Pays an operating cost (Electricity, Maintenance, Rent, Marketing) with idempotency
   * via referenceId so duplicate clicks/retries never double-charge the player.
   */
  async payOperatingExpense(
    playerId: number,
    input: {
      category: Extract<TransactionCategory, 'ELECTRICITY' | 'MAINTENANCE' | 'RENT' | 'MARKETING'>;
      amount: number;
      idempotencyKey: string;
      description?: string;
    }
  ): Promise<{ balanceAfter: number; skippedDuplicate: boolean }> {
    return withTransaction(async (conn) => {
      const [bizRows] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM businesses WHERE player_id = ? AND deleted_at IS NULL ORDER BY id ASC LIMIT 1`,
        [playerId]
      );
      const businessId = bizRows[0] ? Number(bizRows[0].id) : null;

      return this.economyService.recordCashTransaction(conn, {
        playerId,
        businessId,
        transactionType: 'EXPENSE',
        category: input.category,
        amount: input.amount,
        isCredit: false,
        referenceId: `opex_${playerId}_${input.idempotencyKey}`,
        description: input.description ?? `Paid ${input.category.toLowerCase()} bill`,
      });
    });
  }
}
