import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  /**
   * Allowing it to accept cross-origin requests from http://localhost:5173
   * The app can accept requests that send credentials (like cookies or
   * HTTP authentication).
   *
   * HTTP authentication refers to built-in mechanisms in the HTTP protocol to
   * allow client browsers or applications to provide credentials (usually a
   * username and password) to access protected resources on a server.
   *
   * Bearer Token:
   * Often used with OAuth2. Instead of a username and password, the client
   * sends a token as proof of authentication.
   * Authorization: Bearer YOUR_TOKEN_HERE
   */
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
  /**
   * When a client sends a request to the server, it might include cookies in the
   * Cookie HTTP header. The cookieParser middleware parses these cookies and
   * populates the req.cookies object with the cookie key-value pairs. This means
   * that for subsequent middleware and route handlers in Express, you can easily
   * access the cookies sent by the client via req.cookies
   * https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies
   */
  app.use(cookieParser());
  /**
   * Handling file uploads in GraphQL applications.
   * It facilitates the process of uploading files from the client to the server within
   * GraphQL mutations by implementing the GraphQL multipart request specification
   * maxFiles: The maximum number of files that can be uploaded in a single request.
   * The maximum allowed size for uploaded files
   * The given code integrates file upload processing into a GraphQL-Express application,
   * allowing for a maximum of one file of up to 10GB to be uploaded per request
   */
  app.use(graphqlUploadExpress({ maxFileSize: 10000000000, maxFiles: 1 }));
  /**
   * Sets up a global pipe in a NestJS application to handle input validation and
   * transformation.
   *
   * ValidationPipe: This is a built-in pipe in NestJS used for validating incoming
   * request data against some criteria (typically DTO classes).
   *
   * whitelist: When set to true, properties not part of the validation schema
   * (e.g., DTO) will be stripped away, ensuring only expected fields are received.
   *
   * transform: When set to true, it will transform the incoming request data to an
   * instance of the respective DTO class, and also try to perform data transformation
   * based on decorators within the DTO
   *
   * This code globally ensures that incoming request data is both validated and
   * potentially transformed before reaching route handlers or controllers
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      // allows you to customize the exception thrown when validation fails
      exceptionFactory: (errors) => {
        // errors: An array of validation error objects produced by the class-validator
        const formattedErrors = errors.reduce((accumulator, error) => {
          // error.property: The name of the property that has failed validation.
          // error.constraints: An object where keys are the validation rule names
          // and values are the corresponding error messages
          // The value of each property is a concatenated string of all error messages
          // related to that property, separated by , .
          accumulator[error.property] = Object.values(error.constraints).join(
            ', ',
          );
          // Once all errors have been processed and formatted into the accumulator,
          // the function throws a BadRequestException with the formatted error object
          return accumulator;
        }, {});
        throw new BadRequestException(formattedErrors);
      },
    }),
  );
  await app.listen(3000);
}
bootstrap();
