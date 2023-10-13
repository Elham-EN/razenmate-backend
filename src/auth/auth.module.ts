import { Module } from '@nestjs/common';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  // Used for dependency injection
  providers: [
    AuthResolver,
    AuthService,
    PrismaService,
    JwtService,
    ConfigService,
  ],
})
export class AuthModule {}
