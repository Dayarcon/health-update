import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { AuthModule } from '@/auth/auth.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { ExpoService } from './providers/expo.service';
import { ResendService } from './providers/resend.service';
import { TelegramService } from './providers/telegram.service';

@Module({
  imports: [PrismaModule, ConfigModule, AuthModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    ExpoService,
    ResendService,
    TelegramService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
