import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

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
