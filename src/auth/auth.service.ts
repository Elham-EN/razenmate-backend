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
import { LoginDto, RegisterDto } from './dto';
import bcrypt from 'bcrypt';
import { UserType } from './types';

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

  /**
   * The issueTokens function generates both an access JWT token and a refresh
   * JWT token for a given user. It then sets these tokens as httpOnly cookies
   * in the response. The access token expires in 150 seconds, while the refresh
   * token lasts for 7 days. The function returns the user data.
   * @param user
   * @param response
   * @returns {user}
   */
  private issueTokens(user: User, response: Response): { user: UserType } {
    const payload = { username: user.fullname, sub: user.id };

    // Create Access JTW Token
    const accessToken = this.jwtService.sign(
      { ...payload },
      {
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
        expiresIn: '150sec',
      },
    );

    // Create Refresh JWT Token
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: '7d',
    });

    response.cookie('access_token', accessToken, { httpOnly: true });
    response.cookie('refresh_token', refreshToken, { httpOnly: true });

    return { user };
  }
  /**
   * Validates a user's credentials against the stored data in the database.
   * @private
   * @param {LoginDto} loginDto - Data Transfer Object containing the login credentials.
   * @returns {Promise<UserType | null>} - Returns a UserType object if the user is
   * authenticated successfully; otherwise, returns null.
   */
  private async validateUser(loginDto: LoginDto): Promise<UserType | null> {
    // Get the authenticated user from the database
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    // Check if the user exists and if the password is matches
    if (user && (await bcrypt.compare(loginDto.password, user.password))) {
      return user; // Return the authenticated user information
    }
    return null; // otherwise return null
  }

  /**
   * Registers a new user in the system.
   * @public
   * @param {RegisterDto} registerDto - Data Transfer Object containing the user's
   * registration details.
   * @param {Response} response - Express.js response object used to set cookies.
   * @throws {BadRequestException} - Throws an exception if a user with the provided
   * email already exists.
   * @returns {Promise<UserType>} - Returns the registered user's data after setting
   * authentication tokens in cookies.
   */
  public async register(registerDto: RegisterDto, response: Response) {
    // First check if the user already exists in the database with the same email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });
    // if user already exists, throw bad request exception
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }
    // Hash the password
    const hasnhedPassword = await bcrypt.hash(registerDto.password, 10);
    // Create a new user in the database
    const user = await this.prisma.user.create({
      data: {
        fullname: registerDto.fullname,
        password: hasnhedPassword,
        email: registerDto.email,
      },
    });
    // Then issue the tokens that return the user data
    return this.issueTokens(user, response);
  }

  /**
   * Attempts to log a user in.
   * @param loginDto - Data Transfer Object containing the user's login credentials.
   * @param response - Express's Response object used to handle the HTTP response.
   * @throws {UnauthorizedException} - If the user doesn't exist or invalid credentials
   * are provided.
   * @returns A promise that resolves with the user's data and issued tokens.
   */
  public async login(loginDto: LoginDto, response: Response) {
    // First check if the user already exists in the database with the same email
    const user = await this.validateUser(loginDto);
    // if user already exists, throw bad request exception
    if (!user) {
      throw new BadRequestException('invalid credentials');
    }
    // otherwise, issue the tokens that return the user data
    return this.issueTokens(user, response);
  }

  /**
   * Attempts to log a user out.
   * @param response - Express's Response object used to handle the HTTP response.
   * @returns return a string message indicating that the user has been logged out.
   */
  public logout(response: Response): string {
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');
    return 'Successfully logged out';
  }
}
