import {
  Controller,
  Post,
  Get,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ReportsService } from './reports.service';
import { UploadReportDto } from './dto';
import { JwtAuthGuard } from '@/common/guards';
import { CurrentUser } from '@/common/decorators';
import { ReportEntity } from './reports.service';

interface SuccessResponse<T> {
  success: true;
  data: T;
}

interface DeleteResponse {
  success: true;
  data: {
    message: string;
  };
}

@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @HttpCode(HttpStatus.CREATED)
  async upload(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadReportDto,
  ): Promise<SuccessResponse<ReportEntity>> {
    const report = await this.reportsService.uploadReport(user.sub, file, dto);

    return {
      success: true,
      data: report,
    };
  }

  @Get('patients/:patientId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async findAllByPatient(
    @CurrentUser() user: any,
    @Param('patientId') patientId: string,
  ): Promise<SuccessResponse<ReportEntity[]>> {
    const reports = await this.reportsService.findAllByPatient(user.sub, patientId);

    return {
      success: true,
      data: reports,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async findOne(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<SuccessResponse<ReportEntity>> {
    const report = await this.reportsService.findOne(user.sub, id);

    return {
      success: true,
      data: report,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<DeleteResponse> {
    await this.reportsService.remove(user.sub, id);

    return {
      success: true,
      data: {
        message: 'Report deleted successfully',
      },
    };
  }
}
