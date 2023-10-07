import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Use Prisma Client in your NestJS services
// create a new PrismaService that takes care of instantiating
// PrismaClient and connecting to your database
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
