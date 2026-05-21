import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { MessageEvent } from '@nestjs/common/interfaces';

@Controller('location')
export class LocationController {
  constructor(private locationService: LocationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createLocation(@CurrentUser() user: any, @Body() dto: CreateLocationDto) {
    const location = await this.locationService.createLocation(user.sub, dto);
    return { success: true, data: location };
  }

  @Get('latest')
  @UseGuards(JwtAuthGuard)
  async getLatestLocation(@CurrentUser() user: any) {
    const location = await this.locationService.getLatestLocation(user.sub);
    return { success: true, data: location };
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getLocationHistory(
    @CurrentUser() user: any,
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number,
  ) {
    const locations = await this.locationService.getLocationHistory(user.sub, days);
    return { success: true, data: locations };
  }

  @Post('sos')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async triggerSos(@CurrentUser() user: any, @Body() dto: CreateLocationDto) {
    const location = await this.locationService.triggerSos(user.sub, dto);
    return { success: true, data: location };
  }

  @Post('stream-token')
  @UseGuards(JwtAuthGuard)
  async generateSseToken(@CurrentUser() user: any) {
    const token = await this.locationService.generateSseToken(user.sub);
    return { success: true, data: { token } };
  }

  @Sse('stream')
  async stream(@Query('token') token: string): Promise<Observable<MessageEvent>> {
    const userId = await this.locationService.verifySseToken(token);
    if (!userId) {
      throw new Error('Invalid or expired SSE token');
    }
    return this.locationService.getLocationStream(userId);
  }

  @Delete('history')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async clearHistory(@CurrentUser() user: any) {
    const result = await this.locationService.clearHistory(user.sub);
    return { success: true, data: result };
  }
}
