import { NotFoundException } from '@nestjs/common';

export class PatientNotFoundException extends NotFoundException {
  constructor(patientId: string) {
    super({
      success: false,
      error: {
        code: 'PATIENT_NOT_FOUND',
        message: `Patient with ID ${patientId} not found`,
      },
    });
  }
}
