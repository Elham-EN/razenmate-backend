import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginResponse, RegisterResponse } from './types';
import { LoginDto, RegisterDto } from './dto';
import { Request, Response } from 'express';
import { BadRequestException } from '@nestjs/common';

@Resolver()
export class AuthResolver {
  public constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user
   *
   * @param registerDto - define the shape of the request body
   *
   * @param context - contains information about the current request
   *
   * @returns {Promise<RegisterResponse>} Returns a promise that
   * resolves to a RegisterResponse object
   *
   * @Description - registerIinput comes from the frontend and it
   * will have the shape of registerDto and context sharing information
   * and request & response details
   */
  @Mutation(() => RegisterResponse)
  public async register(
    @Args('registerInput') registerDto: RegisterDto,
    @Context() context: { res: Response },
  ) {
    if (registerDto.confirmPassword !== registerDto.password) {
      throw new BadRequestException({
        confirmPassword: "Password and confirm password don't match",
      });
    }
    // otherwise, proceed with the registration of the user
    const { user } = await this.authService.register(registerDto, context.res);
    return { user };
  }

  /**
   * Authenticates a user and provides authentication tokens.
   *
   * @param {LoginDto} loginDto - Data Transfer Object containing user login credentials.
   * @param {Object} context - GraphQL execution context.
   * @param {Response} context.res - Express response object.
   * @returns {Promise<LoginResponse>} Returns a promise that resolves to a LoginResponse
   * object.
   */
  @Mutation(() => LoginResponse)
  public async login(
    @Args('loginInput') loginDto: LoginDto,
    @Context() context: { res: Response },
  ) {
    return this.authService.login(loginDto, context.res);
  }

  @Mutation(() => String)
  public refreshToken(@Context() context: { req: Request; res: Response }) {
    try {
      return this.authService.refreshToken(context.req, context.res);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Mutation(() => String)
  public logout(@Context() context: { res: Response }) {
    return this.authService.logout(context.res);
  }

  @Query(() => String)
  async hello() {
    return 'hello';
  }
}
