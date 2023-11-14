import { ApolloError } from 'apollo-server-express';
import { ArgumentsHost, Catch, BadRequestException } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';

/**
 * exception filter that is responsible for catching exceptions which
 * are an instance of the HttpException class, and implementing custom
 * response logic for them.
 *
 * The @Catch(HttpException) decorator binds the required metadata to
 * the exception filter, telling Nest that this particular filter is
 * looking for exceptions of type HttpException and nothing else.
 */
@Catch(BadRequestException)
export class GrahpQLErrorFilter implements GqlExceptionFilter {
  catch(exception: BadRequestException) {
    const response = exception.getResponse();
    if (typeof response === 'object') {
      throw new ApolloError('Validation error', 'Validation_Error', response);
    } else {
      throw new ApolloError('Bad Request');
    }
  }
}
