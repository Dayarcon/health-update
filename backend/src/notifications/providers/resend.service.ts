import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class ResendService {
  private resend: Resend;
  private logger = new Logger(ResendService.name);
  private fromEmail = 'noreply@medguardian.app';

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    patientName?: string,
    reportType?: string,
    riskLevel?: string,
  ): Promise<void> {
    try {
      const htmlBody = this.buildHtmlEmail(body, patientName, reportType, riskLevel);

      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html: htmlBody,
      });

      this.logger.log(`Email sent to ${to}`);
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error?.message}`);
    }
  }

  private buildHtmlEmail(
    body: string,
    patientName?: string,
    reportType?: string,
    riskLevel?: string,
  ): string {
    return `
      <html>
        <body style="font-family: sans-serif; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>MedGuardian Alert</h2>
            <p>${body}</p>
            ${patientName ? `<p><strong>Patient:</strong> ${patientName}</p>` : ''}
            ${reportType ? `<p><strong>Report Type:</strong> ${reportType}</p>` : ''}
            ${riskLevel ? `<p><strong>Risk Level:</strong> <span style="color: ${this.getRiskColor(riskLevel)}">${riskLevel.toUpperCase()}</span></p>` : ''}
            <hr>
            <p style="font-size: 12px; color: #999;">
              This is an automated alert from MedGuardian. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  private getRiskColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'high':
        return '#dc2626';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  }

  async sendSosEmail(
    to: string,
    subject: string,
    body: string,
    mapsLink: string,
    patientName?: string,
    battery?: number,
  ): Promise<void> {
    try {
      const htmlBody = this.buildSosHtmlEmail(body, mapsLink, patientName, battery);

      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html: htmlBody,
      });

      this.logger.log(`SOS email sent to ${to}`);
    } catch (error: any) {
      this.logger.error(`Failed to send SOS email: ${error?.message}`);
      throw error;
    }
  }

  private buildSosHtmlEmail(
    body: string,
    mapsLink: string,
    patientName?: string,
    battery?: number,
  ): string {
    return `
      <html>
        <body style="font-family: sans-serif; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 24px;">🚨 EMERGENCY ALERT</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">${body}</p>
            </div>

            ${patientName ? `<p><strong>Patient:</strong> ${patientName}</p>` : ''}
            ${battery !== undefined ? `<p><strong>Battery:</strong> ${battery}%</p>` : ''}

            <div style="margin: 20px 0;">
              <a href="${mapsLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                📍 Open Location in Google Maps
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">
              This is an automated emergency alert from MedGuardian. Please provide immediate assistance to the patient if possible.
            </p>
          </div>
        </body>
      </html>
    `;
  }
}
