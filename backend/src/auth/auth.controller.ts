import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, GoogleAuthDto } from './dto';
import { JwtAuthGuard } from '@/common/guards';
import { CurrentUser } from '@/common/decorators';

interface AuthResponse {
  success: true;
  data: {
    userId: string;
    accessToken: string;
    refreshToken: string;
  };
}

interface MeResponse {
  success: true;
  data: {
    id: string;
    email: string;
    name: string | null;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    const result = await this.authService.register(dto);

    return {
      success: true,
      data: result,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    const result = await this.authService.login(dto);

    return {
      success: true,
      data: result,
    };
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleAuth(@Body() dto: GoogleAuthDto): Promise<AuthResponse> {
    const result = await this.authService.googleAuth(dto);

    return {
      success: true,
      data: result,
    };
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @CurrentUser() user: any,
    @Body('refreshToken') refreshToken: string,
  ): Promise<AuthResponse> {
    const tokens = await this.authService.refresh(user.sub, refreshToken);

    return {
      success: true,
      data: {
        userId: user.sub,
        ...tokens,
      },
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async me(@CurrentUser() user: any): Promise<MeResponse> {
    return {
      success: true,
      data: {
        id: user.sub,
        email: user.email,
        name: user.name || null,
      },
    };
  }
}
