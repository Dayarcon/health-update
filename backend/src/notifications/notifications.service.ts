import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ExpoService } from './providers/expo.service';
import { ResendService } from './providers/resend.service';
import { TelegramService } from './providers/telegram.service';

@Injectable()
export class NotificationsService {
  private logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private expoService: ExpoService,
    private resendService: ResendService,
    private telegramService: TelegramService,
  ) {}

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

      const patientId = report.patientId;

      // Get all caregivers for this patient
      const caregiverRelations = await this.prisma.patientCaregiver.findMany({
        where: { patientId, isAccepted: true },
        include: { caregiver: true },
      });

      const title = 'Report Uploaded';
      const body = `${patientName} uploaded a new ${report.reportType} report`;

      await this.prisma.notification.create({
        data: {
          userId: report.patient.userId,
          title,
          message: body,
          type: 'report_uploaded',
          reportId,
          metadata: { patientName, reportType: report.reportType },
        },
      });

      await this.sendToCaregivers(caregiverRelations, title, body, patientName, report.reportType);
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

      const patientId = report.patientId;
      const caregiverRelations = await this.prisma.patientCaregiver.findMany({
        where: { patientId, isAccepted: true },
        include: { caregiver: true },
      });

      const riskLevel = extraction.riskLevel || 'low';

      const title = 'Report Analyzed';
      const body = `${patientName}'s ${report.reportType} report has been analyzed. Risk Level: ${riskLevel}`;

      await this.prisma.notification.create({
        data: {
          userId: report.patient.userId,
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

      await this.sendToCaregivers(
        caregiverRelations,
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

      const patientId = report.patientId;
      const caregiverRelations = await this.prisma.patientCaregiver.findMany({
        where: { patientId, isAccepted: true },
        include: { caregiver: true },
      });

      const title = 'Report Analysis Failed';
      const body = `${patientName}'s ${report.reportType} report analysis failed. Please try uploading again.`;

      await this.prisma.notification.create({
        data: {
          userId: report.patient.userId,
          title,
          message: body,
          type: 'report_failed',
          reportId,
          metadata: { patientName, reportType: report.reportType, error: errorMessage },
        },
      });

      await this.sendToCaregivers(caregiverRelations, title, body, patientName, report.reportType);
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

      // Get patient record to find caregivers
      const patient = await this.prisma.patient.findFirst({
        where: { userId },
      });

      if (!patient) {
        return;
      }

      const caregiverRelations = await this.prisma.patientCaregiver.findMany({
        where: { patientId: patient.id, isAccepted: true },
        include: { caregiver: true },
      });

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

      await this.sendSosToAllCaregivers(caregiverRelations, title, body, mapsLink, user.name ?? undefined, battery);
    } catch (error: any) {
      this.logger.error(`Error notifying SOS alert: ${error?.message}`);
    }
  }

  // INTERNAL HELPERS

  private async sendToCaregivers(
    caregiverRelations: any[],
    title: string,
    body: string,
    patientName?: string,
    reportType?: string,
    riskLevel?: string,
  ): Promise<void> {
    for (const relation of caregiverRelations) {
      const caregiver = relation.caregiver;

      if (caregiver.email) {
        await this.resendService.sendEmail(
          caregiver.email,
          title,
          body,
          patientName,
          reportType,
          riskLevel,
        ).catch((error) => {
          this.logger.error(`Failed to send email: ${error?.message}`);
        });
      }

      if (caregiver.expoToken) {
        await this.expoService.sendPushNotification(caregiver.expoToken, title, body).catch((error) => {
          this.logger.error(`Failed to send push: ${error?.message}`);
        });
      }

      if (caregiver.telegramId) {
        await this.telegramService.sendMessage(
          caregiver.telegramId,
          title,
          body,
          patientName,
          reportType,
          riskLevel,
        ).catch((error) => {
          this.logger.error(`Failed to send Telegram: ${error?.message}`);
        });
      }
    }
  }

  private async sendSosToAllCaregivers(
    caregiverRelations: any[],
    title: string,
    body: string,
    mapsLink: string,
    patientName?: string,
    battery?: number,
  ): Promise<void> {
    for (const relation of caregiverRelations) {
      const caregiver = relation.caregiver;

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

  // CAREGIVER-SPECIFIC NOTIFICATIONS

  async notifyNewInvitation(caregiverId: string, patientName: string, invitationCode: string): Promise<void> {
    try {
      const caregiver = await this.prisma.user.findUnique({
        where: { id: caregiverId },
      });

      if (!caregiver) return;

      const title = 'New Caregiver Invitation';
      const body = `You've been invited to care for ${patientName}. Use code: ${invitationCode}`;

      await this.prisma.notification.create({
        data: {
          userId: caregiverId,
          title,
          message: body,
          type: 'caregiver_added',
          metadata: {
            patientName,
            invitationCode,
          },
        },
      });

      if (caregiver.email) {
        await this.resendService.sendEmail(
          caregiver.email,
          title,
          body,
          patientName,
        ).catch((error) => {
          this.logger.error(`Failed to send invitation email: ${error?.message}`);
        });
      }
    } catch (error: any) {
      this.logger.error(`Error notifying new invitation: ${error?.message}`);
    }
  }

  async notifyInvitationAccepted(patientUserId: string, caregiverName: string, patientName: string): Promise<void> {
    try {
      const title = 'Caregiver Accepted';
      const body = `${caregiverName} has accepted your invitation to care for ${patientName}`;

      await this.prisma.notification.create({
        data: {
          userId: patientUserId,
          title,
          message: body,
          type: 'caregiver_added',
          metadata: {
            caregiverName,
            patientName,
          },
        },
      });
    } catch (error: any) {
      this.logger.error(`Error notifying invitation accepted: ${error?.message}`);
    }
  }

  async notifyPatientReportViewed(patientUserId: string, caregiverName: string, reportType: string): Promise<void> {
    try {
      const title = 'Report Viewed';
      const body = `${caregiverName} viewed your ${reportType} report`;

      await this.prisma.notification.create({
        data: {
          userId: patientUserId,
          title,
          message: body,
          type: 'report_viewed',
          metadata: {
            caregiverName,
            reportType,
          },
        },
      });
    } catch (error: any) {
      this.logger.error(`Error notifying report viewed: ${error?.message}`);
    }
  }
}
