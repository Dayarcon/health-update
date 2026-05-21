import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';

@Injectable()
export class TelegramService {
  private bot: TelegramBot;
  private logger = new Logger(TelegramService.name);

  constructor(private configService: ConfigService) {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }
    this.bot = new TelegramBot(botToken, { polling: false });
  }

  async sendMessage(
    chatId: string,
    title: string,
    body: string,
    patientName?: string,
    reportType?: string,
    riskLevel?: string,
  ): Promise<void> {
    try {
      const message = this.buildMessage(title, body, patientName, reportType, riskLevel);

      await this.bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      });

      this.logger.log(`Telegram message sent to ${chatId}`);
    } catch (error: any) {
      this.logger.error(`Failed to send Telegram message: ${error?.message}`);
    }
  }

  private buildMessage(
    title: string,
    body: string,
    patientName?: string,
    reportType?: string,
    riskLevel?: string,
  ): string {
    let message = `*${title}*\n\n${body}`;

    if (patientName) {
      message += `\n\n👤 Patient: ${patientName}`;
    }

    if (reportType) {
      message += `\n📄 Report Type: ${reportType}`;
    }

    if (riskLevel) {
      const riskEmoji = this.getRiskEmoji(riskLevel);
      message += `\n${riskEmoji} Risk Level: *${riskLevel.toUpperCase()}*`;
    }

    message += `\n\nVisit MedGuardian to view full details.`;

    return message;
  }

  private getRiskEmoji(riskLevel: string): string {
    switch (riskLevel) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  }

  async sendSosMessage(
    chatId: string,
    title: string,
    body: string,
    mapsLink: string,
    patientName?: string,
    battery?: number,
  ): Promise<void> {
    try {
      const message = this.buildSosMessage(title, body, mapsLink, patientName, battery);

      await this.bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      });

      this.logger.log(`SOS Telegram message sent to ${chatId}`);
    } catch (error: any) {
      this.logger.error(`Failed to send SOS Telegram message: ${error?.message}`);
      throw error;
    }
  }

  private buildSosMessage(
    title: string,
    body: string,
    mapsLink: string,
    patientName?: string,
    battery?: number,
  ): string {
    let message = `🚨 *${title}*\n\n${body}`;

    if (patientName) {
      message += `\n\n👤 Patient: ${patientName}`;
    }

    if (battery !== undefined) {
      message += `\n🔋 Battery: ${battery}%`;
    }

    message += `\n\n[📍 View Location](${mapsLink})\n\n⚠️ *Immediate assistance needed*`;

    return message;
  }
}
