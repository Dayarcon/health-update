import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { JwtService } from '@nestjs/jwt';
import { CreateLocationDto } from './dto';
import { Subject, merge, interval, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { MessageEvent } from '@nestjs/common/interfaces';

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);
  private readonly locationSubject = new Subject<any>();

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private jwtService: JwtService,
  ) {}

  async createLocation(userId: string, dto: CreateLocationDto): Promise<any> {
    const location = await this.prisma.locationUpdate.create({
      data: {
        userId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy,
        altitude: dto.altitude,
        heading: dto.heading,
        speed: dto.speed,
        battery: dto.battery,
        isEmergency: false,
      },
    });

    this.pushToStream(location);
    return location;
  }

  async getLatestLocation(userId: string): Promise<any | null> {
    return this.prisma.locationUpdate.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLocationHistory(userId: string, days: number = 7): Promise<any[]> {
    const clampedDays = Math.min(days, 30);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - clampedDays);

    return this.prisma.locationUpdate.findMany({
      where: {
        userId,
        createdAt: { gte: cutoffDate },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async triggerSos(userId: string, dto: CreateLocationDto): Promise<any> {
    const location = await this.prisma.locationUpdate.create({
      data: {
        userId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy,
        altitude: dto.altitude,
        heading: dto.heading,
        speed: dto.speed,
        battery: dto.battery,
        isEmergency: true,
      },
    });

    this.pushToStream(location);

    // Send SOS notifications to all caregivers
    this.notificationsService
      .notifySosAlert(userId, dto.latitude, dto.longitude, dto.battery)
      .catch((error) => {
        this.logger.error(`Failed to send SOS notifications: ${error?.message}`);
      });

    return location;
  }

  async clearHistory(userId: string): Promise<{ deletedCount: number }> {
    const result = await this.prisma.locationUpdate.deleteMany({
      where: { userId },
    });

    return { deletedCount: result.count };
  }

  getLocationStream(userId: string): Observable<MessageEvent> {
    return merge(
      this.locationSubject.asObservable().pipe(
        filter((update) => update.userId === userId),
        map((update) => ({ data: update } as MessageEvent)),
      ),
      interval(30000).pipe(
        map(() => ({ data: 'ping' } as MessageEvent)),
      ),
    );
  }

  async generateSseToken(userId: string): Promise<string> {
    return this.jwtService.sign({ sub: userId }, { expiresIn: '60s' });
  }

  async verifySseToken(token: string): Promise<string | null> {
    try {
      const decoded = this.jwtService.verify(token);
      return decoded.sub;
    } catch {
      return null;
    }
  }

  private pushToStream(location: any): void {
    this.locationSubject.next(location);
  }
}
