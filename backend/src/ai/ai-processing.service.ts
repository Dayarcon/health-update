import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '@/common/prisma/prisma.service';
import { GeminiService } from './gemini.service';
import { NotificationsService } from '@/notifications/notifications.service';

@Injectable()
export class AiProcessingService {
  private logger = new Logger(AiProcessingService.name);

  constructor(
    private prisma: PrismaService,
    private geminiService: GeminiService,
    private notificationsService: NotificationsService,
  ) {}

  async processJob(job: any): Promise<void> {
    try {
      // Mark job and report as processing
      await this.prisma.job.update({
        where: { id: job.id },
        data: { status: 'processing' },
      });

      const report = await this.prisma.report.findUnique({
        where: { id: job.reportId },
        include: { patient: true },
      });

      if (!report) {
        throw new Error(`Report ${job.reportId} not found`);
      }

      await this.prisma.report.update({
        where: { id: report.id },
        data: { processingStatus: 'processing' },
      });

      // Download file
      this.logger.log(`Downloading report from ${report.imageUrl}`);
      const fileResponse = await axios.get(report.imageUrl, {
        responseType: 'arraybuffer',
      });
      const fileBuffer = Buffer.from(fileResponse.data);

      // Determine MIME type from fileName
      const mimeType = this.getMimeTypeFromFileName(report.fileName);

      // Extract data with Gemini
      this.logger.log(`Processing ${report.reportType} with Gemini`);
      const extraction = await this.geminiService.extractMedicalData(
        fileBuffer,
        mimeType,
      );

      // Save results in a transaction
      await this.prisma.$transaction(async (tx: any) => {
        // Update report with AI results
        await tx.report.update({
          where: { id: report.id },
          data: {
            rawOcrText: extraction.rawText,
            aiSummary: extraction,
            riskLevel: extraction.riskLevel,
            processingStatus: 'completed',
          },
        });

        // Create medicine records
        for (const medicine of extraction.medicines) {
          await tx.medicine.create({
            data: {
              reportId: report.id,
              name: medicine.name,
              dosage: medicine.dosage,
              frequency: medicine.frequency,
              duration: medicine.duration,
            },
          });
        }

        // Create diagnosis records
        for (const condition of extraction.diagnosis) {
          await tx.diagnosis.create({
            data: {
              reportId: report.id,
              condition,
            },
          });
        }
      });

      // Mark job as completed
      await this.prisma.job.update({
        where: { id: job.id },
        data: { status: 'completed' },
      });

      // Notify caregivers of report completion
      this.notificationsService
        .notifyReportCompleted(report.id, report.patient?.name || 'Unknown', extraction)
        .catch(() => {
          // Swallow notification errors
        });

      this.logger.log(`✓ Job ${job.id} completed successfully`);
    } catch (error: any) {
      this.logger.error(`Job ${job.id} failed: ${error?.message}`);

      const newRetries = job.retries + 1;
      const isFailed = newRetries >= job.maxRetries;

      if (isFailed) {
        // Mark as permanently failed
        await this.prisma.job.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            error: error?.message || 'Unknown error',
            retries: newRetries,
          },
        });

        const report = await this.prisma.report.findUnique({
          where: { id: job.reportId },
          include: { patient: true },
        });
        if (report) {
          await this.prisma.report.update({
            where: { id: report.id },
            data: { processingStatus: 'failed' },
          });

          // Notify caregivers of report failure
          this.notificationsService
            .notifyReportFailed(report.id, report.patient?.name || 'Unknown', error?.message)
            .catch(() => {
              // Swallow notification errors
            });
        }

        this.logger.error(
          `✗ Job ${job.id} failed permanently after ${newRetries} retries`,
        );
      } else {
        // Retry later
        await this.prisma.job.update({
          where: { id: job.id },
          data: {
            status: 'pending',
            retries: newRetries,
          },
        });

        this.logger.warn(`↻ Job ${job.id} will be retried (attempt ${newRetries})`);
      }
    }
  }

  private getMimeTypeFromFileName(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();

    const mimeMap: Record<string, string> = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
    };

    return mimeMap[ext || ''] || 'application/octet-stream';
  }
}
