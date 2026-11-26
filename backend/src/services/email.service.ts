import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface EmailProvider {
  sendPasswordResetEmail(toEmail: string, resetUrl: string): Promise<void>;
}

class ConsoleEmailProvider implements EmailProvider {
  async sendPasswordResetEmail(toEmail: string, resetUrl: string): Promise<void> {
    logger.info('Password reset email dispatched (dev transport)', {
      toEmail,
      resetUrl,
      provider: 'console',
    });
  }
}

export class EmailService {
  private readonly provider: EmailProvider;

  constructor(provider: EmailProvider = new ConsoleEmailProvider()) {
    this.provider = provider;
  }

  async sendPasswordReset(toEmail: string, rawResetToken: string): Promise<void> {
    const resetUrl = `${env.corsOrigin}/forgot-password?token=${encodeURIComponent(rawResetToken)}`;
    await this.provider.sendPasswordResetEmail(toEmail, resetUrl);
  }
}
