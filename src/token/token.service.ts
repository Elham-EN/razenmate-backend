import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verify } from 'jsonwebtoken';

@Injectable()
export class TokenService {
  public constructor(private configService: ConfigService) {}

  public extractToken(connectionParams: any): string | null {
    return connectionParams?.token || null;
  }

  public validateToken(token: string): any {
    const refreshTokenSecret = this.configService.get<string>(
      'REFRESH_TOKEN_SECRET',
    );
    try {
      return verify(token, refreshTokenSecret);
    } catch (error) {
      return null;
    }
  }
}
