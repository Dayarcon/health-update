import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AiProcessingService } from '@/ai/ai-processing.service';

@Injectable()
export class JobQueueService {
  private logger = new Logger(JobQueueService.name);
  private isProcessing = false;

  constructor(
    private prisma: PrismaService,
    private aiProcessingService: AiProcessingService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async processQueue(): Promise<void> {
    // Prevent overlapping executions
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // Find pending jobs (up to 5 to respect Gemini rate limit)
      const pendingJobs = await this.prisma.job.findMany({
        where: {
          status: 'pending',
          jobType: 'ocr',
          retries: {
            lt: 3,
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 5,
      });

      if (pendingJobs.length === 0) {
        return;
      }

      this.logger.log(`Found ${pendingJobs.length} pending OCR jobs`);

      // Process jobs sequentially to respect Gemini rate limits (15 RPM)
      for (const job of pendingJobs) {
        await this.aiProcessingService.processJob(job);
      }
    } catch (error: any) {
      this.logger.error(`Queue processing error: ${error?.message}`);
    } finally {
      this.isProcessing = false;
    }
  }
}
