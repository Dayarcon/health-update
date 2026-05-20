import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { AiModule } from '@/ai/ai.module';
import { JobQueueService } from './job-queue.service';

@Module({
  imports: [PrismaModule, AiModule, ScheduleModule.forRoot()],
  providers: [JobQueueService],
})
export class QueueModule {}
