import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateCaregiverDto } from './dto/create-caregiver.dto';
import { UpdateCaregiverDto } from './dto/update-caregiver.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  // CAREGIVER ENDPOINTS

  @Post('caregivers')
  async createCaregiver(
    @CurrentUser() userId: string,
    @Body() dto: CreateCaregiverDto,
  ) {
    const caregiver = await this.notificationsService.createCaregiver(userId, dto);
    return { success: true, data: caregiver };
  }

  @Get('caregivers')
  async listCaregivers(@CurrentUser() userId: string) {
    const caregivers = await this.notificationsService.listCaregivers(userId);
    return { success: true, data: caregivers };
  }

  @Get('caregivers/:id')
  async getCaregiver(@CurrentUser() userId: string, @Param('id') caregiverId: string) {
    const caregiver = await this.notificationsService.getCaregiver(userId, caregiverId);
    return { success: true, data: caregiver };
  }

  @Patch('caregivers/:id')
  async updateCaregiver(
    @CurrentUser() userId: string,
    @Param('id') caregiverId: string,
    @Body() dto: UpdateCaregiverDto,
  ) {
    const caregiver = await this.notificationsService.updateCaregiver(
      userId,
      caregiverId,
      dto,
    );
    return { success: true, data: caregiver };
  }

  @Delete('caregivers/:id')
  async removeCaregiver(@CurrentUser() userId: string, @Param('id') caregiverId: string) {
    await this.notificationsService.removeCaregiver(userId, caregiverId);
    return { success: true, data: null };
  }

  // NOTIFICATION ENDPOINTS

  @Get()
  async listNotifications(@CurrentUser() userId: string) {
    const notifications = await this.notificationsService.listNotifications(userId);
    return { success: true, data: notifications };
  }

  @Patch(':id/read')
  async markAsRead(@CurrentUser() userId: string, @Param('id') notificationId: string) {
    const notification = await this.notificationsService.markAsRead(userId, notificationId);
    return { success: true, data: notification };
  }
}
