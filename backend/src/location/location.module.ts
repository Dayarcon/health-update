import { Module } from '@nestjs/common';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { AuthModule } from '@/auth/auth.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { LocationCleanupService } from './location.cleanup.service';

@Module({
  imports: [PrismaModule, AuthModule, NotificationsModule],
  controllers: [LocationController],
  providers: [LocationService, LocationCleanupService],
  exports: [LocationService],
})
export class LocationModule {}
