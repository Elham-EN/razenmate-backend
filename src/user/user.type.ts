import { Field, Int, ObjectType } from '@nestjs/graphql';

/**
 * Defines a User class for a GraphQL schema using NestJS's GraphQL module
 * Various properties of the User class are marked as GraphQL fields.
 *
 * it's a GraphQL representation of a User, with certain fields being
 * optional in the response
 */

// User class is treated as GraphQL Object Type
@ObjectType()
export class User {
  // This field can return a null value in a GraphQL response.
  // In other words, it's optional
  @Field(() => Int, { nullable: true })
  id?: number;

  @Field(() => String)
  fullname: string;

  @Field(() => String)
  email?: string;

  @Field(() => String, { nullable: true })
  avatarUrl?: string;

  @Field(() => String, { nullable: true })
  password?: string;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}

/**
 *  This allows GraphQL queries to request the id of a User, but
 *  it's not guaranteed that every User will have an id (it can
 *  be null).
 */
