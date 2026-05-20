import { NotFoundException } from '@nestjs/common';

export class ReportNotFoundException extends NotFoundException {
  constructor(reportId: string) {
    super({
      success: false,
      error: {
        code: 'REPORT_NOT_FOUND',
        message: `Report with ID ${reportId} not found`,
      },
    });
  }
}
