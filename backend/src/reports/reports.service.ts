import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { PatientsService } from '@/patients/patients.service';
import { StorageService } from '@/storage/storage.service';
import { ReportNotFoundException } from '@/common/exceptions';
import { UploadReportDto } from './dto';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export interface ReportEntity {
  id: string;
  patientId: string;
  reportType: string;
  imageUrl: string;
  fileName: string;
  rawOcrText: string | null;
  aiSummary: any;
  riskLevel: string | null;
  processingStatus: string;
  createdAt: Date;
  updatedAt: Date;
  medicines?: any[];
  diagnoses?: any[];
}

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private patientsService: PatientsService,
    private storageService: StorageService,
  ) {}

  async uploadReport(
    userId: string,
    file: Express.Multer.File,
    dto: UploadReportDto,
  ): Promise<ReportEntity> {
    // Verify patient ownership
    await this.patientsService.findOne(userId, dto.patientId);

    // Validate file
    this.validateFile(file);

    // Build storage path
    const timestamp = Date.now();
    const sanitisedFileName = this.sanitiseFileName(file.originalname);
    const storagePath = `reports/${dto.patientId}/${timestamp}-${sanitisedFileName}`;

    // Upload to Supabase
    const imageUrl = await this.storageService.uploadFile(
      'reports',
      storagePath,
      file.buffer,
      file.mimetype,
    );

    // Create report record
    const report = await this.prisma.report.create({
      data: {
        patientId: dto.patientId,
        reportType: dto.reportType,
        imageUrl,
        fileName: file.originalname,
        processingStatus: 'pending',
      },
      include: {
        medicines: true,
        diagnoses: true,
      },
    });

    // Create job for OCR pipeline
    await this.prisma.job.create({
      data: {
        reportId: report.id,
        jobType: 'ocr',
        status: 'pending',
      },
    });

    return this.mapToEntity(report);
  }

  async findAllByPatient(userId: string, patientId: string): Promise<ReportEntity[]> {
    // Verify patient ownership
    await this.patientsService.findOne(userId, patientId);

    const reports = await this.prisma.report.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        medicines: true,
        diagnoses: true,
      },
    });

    return reports.map(this.mapToEntity);
  }

  async findOne(userId: string, id: string): Promise<ReportEntity> {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        medicines: true,
        diagnoses: true,
      },
    });

    if (!report) {
      throw new ReportNotFoundException(id);
    }

    // Verify ownership through the patient
    await this.patientsService.findOne(userId, report.patientId);

    return this.mapToEntity(report);
  }

  async remove(userId: string, id: string): Promise<void> {
    const report = await this.findOne(userId, id);

    // Delete file from Supabase
    const fileName = report.fileName;
    const storagePath = `reports/${report.patientId}/${report.id}-${fileName}`;
    await this.storageService.deleteFile('reports', storagePath).catch(() => {
      // Ignore errors if file doesn't exist in storage
    });

    // Delete DB record (cascades to medicines, diagnoses, and jobs)
    await this.prisma.report.delete({
      where: { id },
    });
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'INVALID_FILE',
          message: 'No file provided',
        },
      });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'INVALID_FILE',
          message: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
        },
      });
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'INVALID_FILE',
          message: `File size exceeds 20MB limit. Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        },
      });
    }
  }

  private sanitiseFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .toLowerCase()
      .substring(0, 100);
  }

  private mapToEntity(report: any): ReportEntity {
    return {
      id: report.id,
      patientId: report.patientId,
      reportType: report.reportType,
      imageUrl: report.imageUrl,
      fileName: report.fileName,
      rawOcrText: report.rawOcrText,
      aiSummary: report.aiSummary,
      riskLevel: report.riskLevel,
      processingStatus: report.processingStatus,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      medicines: report.medicines || [],
      diagnoses: report.diagnoses || [],
    };
  }
}
