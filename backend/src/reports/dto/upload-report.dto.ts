import { IsString, IsNotEmpty, IsIn } from 'class-validator';

const REPORT_TYPES = ['prescription', 'eeg', 'lab', 'bill', 'discharge'];

export class UploadReportDto {
  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(REPORT_TYPES)
  reportType!: string;
}
