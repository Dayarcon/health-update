import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RegisterDto, LoginDto, GoogleAuthDto } from './dto';
import {
  EmailAlreadyExistsException,
  InvalidCredentialsException,
  InvalidGoogleTokenException,
} from '@/common/exceptions';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens & { userId: string }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new EmailAlreadyExistsException(dto.email);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      userId: user.id,
      ...tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthTokens & { userId: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new InvalidCredentialsException();
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      userId: user.id,
      ...tokens,
    };
  }

  async googleAuth(dto: GoogleAuthDto): Promise<AuthTokens & { userId: string }> {
    const googleToken = await this.verifyGoogleToken(dto.idToken);

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ googleId: googleToken.sub }, { email: googleToken.email }],
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleToken.email,
          name: googleToken.name,
          googleId: googleToken.sub,
        },
      });
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleToken.sub },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      userId: user.id,
      ...tokens,
    };
  }

  async refresh(
    userId: string,
    refreshToken: string,
  ): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.refreshToken) {
      throw new InvalidCredentialsException();
    }

    const isTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);

    if (!isTokenValid) {
      throw new InvalidCredentialsException();
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  private async generateTokens(userId: string, email: string): Promise<AuthTokens> {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRATION') || '24h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '30d',
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    });

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: refreshTokenHash },
    });
  }

  private async verifyGoogleToken(idToken: string): Promise<any> {
    try {
      const response = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
        params: { id_token: idToken },
      });

      const tokenData = response.data;

      const expectedAudience = this.configService.get('GOOGLE_CLIENT_ID');
      if (expectedAudience && tokenData.aud !== expectedAudience) {
        throw new InvalidGoogleTokenException('Invalid token audience');
      }

      return tokenData;
    } catch (error: any) {
      if (error instanceof InvalidGoogleTokenException) {
        throw error;
      }

      throw new InvalidGoogleTokenException(
        error?.message || 'Failed to verify Google token',
      );
    }
  }
}
