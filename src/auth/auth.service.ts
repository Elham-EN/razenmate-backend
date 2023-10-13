import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { Request, Response } from 'express';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AuthService {
  public constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  // We need refresh token to generate a new token (access token is short lived)
  public async refreshToken(req: Request, res: Response): Promise<string> {
    const refreshToken = req.cookies['refresh_token'];
    // if there is not refresh token
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }
    // If there is refresh token
    let payload;
    try {
      //  to check if the token is genuine and hasn't been tampered with, by
      // comparing it against the secret stored in the configuration
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      });
    } catch (error) {
      // If the token is valid, it returns the payload of the token; if not,
      // it throws an error
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    const userExists = await this.prisma.user.findUnique({
      // sub (Subject) - The subject of the token, often a user ID.
      where: { id: payload.sub },
    });
    if (!userExists) {
      throw new BadRequestException('User no longer exists');
    }
    //* Generate a new access token
    const expireIn = 15000;
    // expiration is set to 15,000 seconds (or 4 hours and 10 minutes)
    // from the current time
    const expiration = Math.floor(Date.now() / 1000) + expireIn;
    // accessToken, is a new JWT that contains the provided payload and is signed
    // with the specified secret. This token can later be verified and decoded using
    // the same secret.
    const accessToken = this.jwtService.sign(
      // The first argument { ...payload, exp: expiration } is the payload data
      // that will be embedded inside the token
      { ...payload, exp: expiration },
      // The configuration for signing the JWT. Specifically, it specifies the
      // secret key used to sign the token
      { secret: this.configService.get<string>('ACCESS_TOKEN_SECRET') },
    );
    // Option means that the cookie can't be accessed through client-side
    // JavaScript. It can only be sent back to the server with HTTP requests.
    res.cookie('access_token', accessToken, { httpOnly: true });
    return accessToken;
  }

  private async issueTokens(user: User, response: Response): Promise<void> {}
}
