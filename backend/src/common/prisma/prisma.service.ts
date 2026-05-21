import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      // Log connection error but don't block app startup
      // Prisma will retry on first query attempt
      console.error('Database connection failed at startup:', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
