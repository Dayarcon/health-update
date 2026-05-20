import { ConflictException } from '@nestjs/common';

export class EmailAlreadyExistsException extends ConflictException {
  constructor(email: string) {
    super({
      success: false,
      error: {
        code: 'EMAIL_EXISTS',
        message: `User with email ${email} already exists`,
      },
    });
  }
}
