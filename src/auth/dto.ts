import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

@InputType()
export class RegisterDto {
  @Field(() => String)
  @IsNotEmpty({ message: 'Full name is required' })
  @IsString({ message: 'Full name should be a string' })
  fullname: string;

  @Field(() => String)
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email should be a valid email' })
  email: string;

  @Field(() => String)
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password should be at least 8 characters long' })
  password: string;

  // Confirm Password
  @Field(() => String)
  @IsNotEmpty({ message: 'Confirm password is required' })
  confirmPassword: string;
}

@InputType()
export class LoginDto {
  @Field(() => String)
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email should be a valid email' })
  email: string;

  @Field(() => String)
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
