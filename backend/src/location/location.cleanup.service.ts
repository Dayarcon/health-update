import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class LocationCleanupService {
  private readonly logger = new Logger(LocationCleanupService.name);

  constructor(private prisma: PrismaService) {}

  @Cron('0 2 * * *')
  async cleanupOldLocations(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    try {
      const result = await this.prisma.locationUpdate.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
        },
      });
      this.logger.log(`Location cleanup: deleted ${result.count} records older than 30 days`);
    } catch (error: any) {
      this.logger.error(`Location cleanup failed: ${error?.message}`);
    }
  }
}
