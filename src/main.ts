import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
    // The app will accept requests with these headers.
    allowedHeaders: [
      'Accept',
      'Authorization',
      'Content-Type',
      'X-Requested-With',
      'Apollo-Require-Preflight',
    ],
    // Specifies the HTTP methods the app will respond to from the specified origin
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  });
  app.use(cookieParser());
  app.use(graphqlUploadExpress({ maxFileSize: 10000000000, maxFiles: 1 }));
  // instruct Nest.js to automatically validate incoming requests against the relevant DTOs.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      // allows you to customize the exception thrown when validation fails
      exceptionFactory: (errors) => {
        // errors: An array of validation error objects produced by the class-validator
        const formattedErrors = errors.reduce((accumulator, error) => {
          accumulator[error.property] = Object.values(error.constraints).join(
            ', ',
          );
          return accumulator;
        }, {});
        throw new BadRequestException(formattedErrors);
      },
    }),
  );
  await app.listen(3000);
}
bootstrap();
