import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Expo from 'expo-server-sdk';

@Injectable()
export class ExpoService {
  private expo: Expo;
  private logger = new Logger(ExpoService.name);

  constructor(private configService: ConfigService) {
    const accessToken = this.configService.get<string>('EXPO_ACCESS_TOKEN');
    this.expo = new Expo({ accessToken });
  }

  async sendPushNotification(
    expoToken: string,
    title: string,
    body: string,
  ): Promise<void> {
    try {
      if (!Expo.isExpoPushToken(expoToken)) {
        this.logger.warn(`Invalid Expo token: ${expoToken}`);
        return;
      }

      const message = {
        to: expoToken,
        sound: 'default' as const,
        title,
        body,
        badge: 1,
      };

      await this.expo.sendPushNotificationsAsync([message]);
      this.logger.log(`Push notification sent to ${expoToken}`);
    } catch (error: any) {
      this.logger.error(`Failed to send push notification: ${error?.message}`);
    }
  }

  async sendSosPush(
    expoToken: string,
    title: string,
    body: string,
    mapsLink: string,
  ): Promise<void> {
    try {
      if (!Expo.isExpoPushToken(expoToken)) {
        this.logger.warn(`Invalid Expo token: ${expoToken}`);
        return;
      }

      const message = {
        to: expoToken,
        sound: 'default' as const,
        title,
        body,
        badge: 1,
        priority: 'high' as const,
        data: { mapsLink },
      };

      await this.expo.sendPushNotificationsAsync([message]);
      this.logger.log(`SOS push notification sent to ${expoToken}`);
    } catch (error: any) {
      this.logger.error(`Failed to send SOS push notification: ${error?.message}`);
      throw error;
    }
  }
}
