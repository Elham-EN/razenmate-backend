import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { TokenService } from './token/token.service';

/**
 * Redis pub sub offer real-time feature: display user that currently
 * live in the room
 */

// Creating a redis client to connect to the Redis server
const pubSub = new RedisPubSub({
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    retryStrategy: (time) => {
      return Math.min(time * 50, 2000);
    },
  },
});

@Module({
  imports: [
    // To build GraphQL applications with the code first approach
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      imports: [ConfigModule, AppModule],
      inject: [ConfigService],
      driver: ApolloDriver,
      useFactory: async (
        configService: ConfigService,
        tokenService: TokenService,
      ) => {
        return {
          installSubscriptionHandlers: true, // To enable subscription
          playground: true,
          autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
          sortSchema: true,
          // Use both packages at the same time
          subscriptions: {
            'graphql-ws': true,
            'subscriptions-transport-ws': true,
          },
          onConnect: (connectionParams) => {
            const token = tokenService.extractToken(connectionParams);
            if (!token) {
              throw new Error('Token was not provided');
            }
            const user = tokenService.validateToken(token);
            if (!user) {
              throw new Error('Invalid token');
            }
            return { user };
          },
          // connection.context will be equal to what was returned by the
          // "onConnect" callback
          context: ({ req, res, connection }) => {
            if (connection) {
              // Injecting pubSub into context
              return { req, res, user: connection.context.user, pubSub };
            }
            return { req, res };
          },
        };
      },
    }),
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService, ConfigService, TokenService],
})
export class AppModule {}
