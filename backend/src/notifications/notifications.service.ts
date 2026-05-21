import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ExpoService } from './providers/expo.service';
import { ResendService } from './providers/resend.service';
import { TelegramService } from './providers/telegram.service';
import { CreateCaregiverDto } from './dto/create-caregiver.dto';
import { UpdateCaregiverDto } from './dto/update-caregiver.dto';

@Injectable()
export class NotificationsService {
  private logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private expoService: ExpoService,
    private resendService: ResendService,
    private telegramService: TelegramService,
  ) {}

  // CAREGIVER MANAGEMENT

  async createCaregiver(userId: string, dto: CreateCaregiverDto) {
    const caregiver = await this.prisma.caregiver.create({
      data: {
        userId,
        name: dto.name,
        relation: dto.relation,
        email: dto.email,
        expoToken: dto.expoToken,
        telegramId: dto.telegramId,
      },
    });

    return caregiver;
  }

  async listCaregivers(userId: string) {
    return this.prisma.caregiver.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCaregiver(userId: string, caregiverId: string) {
    const caregiver = await this.prisma.caregiver.findFirst({
      where: { id: caregiverId, userId },
    });

    if (!caregiver) {
      throw new NotFoundException('Caregiver not found');
    }

    return caregiver;
  }

  async updateCaregiver(userId: string, caregiverId: string, dto: UpdateCaregiverDto) {
    await this.getCaregiver(userId, caregiverId);

    return this.prisma.caregiver.update({
      where: { id: caregiverId },
      data: {
        name: dto.name,
        relation: dto.relation,
        email: dto.email,
        expoToken: dto.expoToken,
        telegramId: dto.telegramId,
      },
    });
  }

  async removeCaregiver(userId: string, caregiverId: string) {
    await this.getCaregiver(userId, caregiverId);

    return this.prisma.caregiver.delete({
      where: { id: caregiverId },
    });
  }

  // NOTIFICATION MANAGEMENT

  async listNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  // NOTIFICATION TRIGGERS

  async notifyReportUploaded(reportId: string, patientName: string): Promise<void> {
    try {
      const report = await this.prisma.report.findUnique({
        where: { id: reportId },
        include: { patient: { include: { user: true } } },
      });

      if (!report) return;

      const userId = report.patient.userId;
      const caregivers = await this.listCaregivers(userId);

      const title = 'Report Uploaded';
      const body = `${patientName} uploaded a new ${report.reportType} report`;

      await this.prisma.notification.create({
        data: {
          userId,
          title,
          message: body,
          type: 'report_uploaded',
          reportId,
          metadata: { patientName, reportType: report.reportType },
        },
      });

      await this.sendToAllCaregivers(caregivers, title, body, patientName, report.reportType);
    } catch (error: any) {
      this.logger.error(`Error notifying report upload: ${error?.message}`);
    }
  }

  async notifyReportCompleted(
    reportId: string,
    patientName: string,
    extraction: any,
  ): Promise<void> {
    try {
      const report = await this.prisma.report.findUnique({
        where: { id: reportId },
        include: { patient: { include: { user: true } } },
      });

      if (!report) return;

      const userId = report.patient.userId;
      const caregivers = await this.listCaregivers(userId);
      const riskLevel = extraction.riskLevel || 'low';

      const title = 'Report Analyzed';
      const body = `${patientName}'s ${report.reportType} report has been analyzed. Risk Level: ${riskLevel}`;

      await this.prisma.notification.create({
        data: {
          userId,
          title,
          message: body,
          type: 'report_completed',
          reportId,
          metadata: {
            patientName,
            reportType: report.reportType,
            riskLevel,
            medicineCount: extraction.medicines?.length || 0,
            diagnosisCount: extraction.diagnosis?.length || 0,
          },
        },
      });

      await this.sendToAllCaregivers(
        caregivers,
        title,
        body,
        patientName,
        report.reportType,
        riskLevel,
      );
    } catch (error: any) {
      this.logger.error(`Error notifying report completion: ${error?.message}`);
    }
  }

  async notifyReportFailed(reportId: string, patientName: string, errorMessage: string): Promise<void> {
    try {
      const report = await this.prisma.report.findUnique({
        where: { id: reportId },
        include: { patient: { include: { user: true } } },
      });

      if (!report) return;

      const userId = report.patient.userId;
      const caregivers = await this.listCaregivers(userId);

      const title = 'Report Analysis Failed';
      const body = `${patientName}'s ${report.reportType} report analysis failed. Please try uploading again.`;

      await this.prisma.notification.create({
        data: {
          userId,
          title,
          message: body,
          type: 'report_failed',
          reportId,
          metadata: { patientName, reportType: report.reportType, error: errorMessage },
        },
      });

      await this.sendToAllCaregivers(caregivers, title, body, patientName, report.reportType);
    } catch (error: any) {
      this.logger.error(`Error notifying report failure: ${error?.message}`);
    }
  }

  async notifySosAlert(userId: string, latitude: number, longitude: number, battery?: number): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return;
      }

      const caregivers = await this.listCaregivers(userId);
      const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
      const title = 'EMERGENCY ALERT';
      const body = `${user.name || 'Patient'} needs immediate help! Location: ${mapsLink}${battery !== undefined ? ` | Battery: ${battery}%` : ''}`;

      await this.prisma.notification.create({
        data: {
          userId,
          title,
          message: body,
          type: 'sos_alert',
          metadata: {
            latitude,
            longitude,
            mapsLink,
            battery,
          },
        },
      });

      await this.sendSosToAllCaregivers(caregivers, title, body, mapsLink, user.name ?? undefined, battery);
    } catch (error: any) {
      this.logger.error(`Error notifying SOS alert: ${error?.message}`);
    }
  }

  // INTERNAL HELPERS

  private async sendToAllCaregivers(
    caregivers: any[],
    title: string,
    body: string,
    patientName?: string,
    reportType?: string,
    riskLevel?: string,
  ): Promise<void> {
    for (const caregiver of caregivers) {
      if (caregiver.email) {
        await this.resendService.sendEmail(
          caregiver.email,
          title,
          body,
          patientName,
          reportType,
          riskLevel,
        );
      }

      if (caregiver.expoToken) {
        await this.expoService.sendPushNotification(caregiver.expoToken, title, body);
      }

      if (caregiver.telegramId) {
        await this.telegramService.sendMessage(
          caregiver.telegramId,
          title,
          body,
          patientName,
          reportType,
          riskLevel,
        );
      }
    }
  }

  private async sendSosToAllCaregivers(
    caregivers: any[],
    title: string,
    body: string,
    mapsLink: string,
    patientName?: string,
    battery?: number,
  ): Promise<void> {
    for (const caregiver of caregivers) {
      if (caregiver.email) {
        await this.resendService.sendSosEmail(
          caregiver.email,
          title,
          body,
          mapsLink,
          patientName,
          battery,
        ).catch((error) => {
          this.logger.error(`Failed to send SOS email: ${error?.message}`);
        });
      }

      if (caregiver.expoToken) {
        await this.expoService.sendSosPush(caregiver.expoToken, title, body, mapsLink).catch((error) => {
          this.logger.error(`Failed to send SOS push: ${error?.message}`);
        });
      }

      if (caregiver.telegramId) {
        await this.telegramService.sendSosMessage(
          caregiver.telegramId,
          title,
          body,
          mapsLink,
          patientName,
          battery,
        ).catch((error) => {
          this.logger.error(`Failed to send SOS Telegram: ${error?.message}`);
        });
      }
    }
  }
}
