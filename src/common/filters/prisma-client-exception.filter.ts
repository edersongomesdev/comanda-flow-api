import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception.code === 'P2002') {
      throw new ConflictException(
        'A unique constraint would be violated by this operation.',
      );
    }

    if (exception.code === 'P2025') {
      throw new NotFoundException('The requested record was not found.');
    }

    response.status(500).json({
      statusCode: 500,
      message: 'Unexpected database error.',
      error: 'Internal Server Error',
    });
  }
}
