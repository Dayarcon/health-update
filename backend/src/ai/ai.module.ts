import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { GeminiService } from './gemini.service';
import { AiProcessingService } from './ai-processing.service';

@Module({
  imports: [PrismaModule, ConfigModule, NotificationsModule],
  providers: [GeminiService, AiProcessingService],
  exports: [GeminiService, AiProcessingService],
})
export class AiModule {}
