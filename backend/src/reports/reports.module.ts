import { Module } from '@nestjs/common';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { AuthModule } from '@/auth/auth.module';
import { PatientsModule } from '@/patients/patients.module';
import { StorageModule } from '@/storage/storage.module';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [PrismaModule, AuthModule, PatientsModule, StorageModule],
  providers: [ReportsService],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
