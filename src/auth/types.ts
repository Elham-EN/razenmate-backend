import { Field, ObjectType } from '@nestjs/graphql';
import { User } from 'src/user/user.type';

// During registration, the system might not always return a user,
// perhaps due to validation or email is already taken
@ObjectType()
export class RegisterResponse {
  @Field(() => User, { nullable: true })
  user?: User;
}

// A successful login always expects a user object in the response
@ObjectType()
export class LoginResponse {
  @Field(() => User)
  user: User;
}
