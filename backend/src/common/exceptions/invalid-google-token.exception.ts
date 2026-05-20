import { UnauthorizedException } from '@nestjs/common';

export class InvalidGoogleTokenException extends UnauthorizedException {
  constructor(reason = 'Invalid or expired Google token') {
    super({
      success: false,
      error: {
        code: 'INVALID_GOOGLE_TOKEN',
        message: reason,
      },
    });
  }
}
