import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

/**
 * Guards have a single responsibility. They determine whether a given
 * request will be handled by the route handler or not, depending on
 * certain conditions.
 * Use this guard to protect mutations and queries from unauthorized users.
 */
@Injectable()
export class GraphqlAuthGuard implements CanActivate {
  public constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * This function should return a boolean, indicating whether the
   * current request is allowed or not
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // retrieves the third argument, which is the GraphQL context
    const gqlCtx = context.getArgByIndex(2);
    // the GraphQL context contains the original HTTP request
    const request: Request = gqlCtx.req;
    // retrieve the access token from the request
    const token = this.extractTokenFromCookie(request);
    // if no token is found, return unauthorized exception
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      // get the payload from the token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      });
      // rquest['user'] contains the authenticated user's data
      // and then the route handler can access the request['user'] data
      request['user'] = payload;
      console.log('payload', payload);
    } catch (error) {
      console.log('error:', error);
      throw new UnauthorizedException();
    }
    // return true if the token is valid
    return true;
  }

  private extractTokenFromCookie(request: Request): string | undefined {
    const token = request.cookies?.access_token;
    return token;
  }
}
