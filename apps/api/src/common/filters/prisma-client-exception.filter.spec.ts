import { ArgumentsHost } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Response } from 'express';
import { PrismaClientExceptionFilter } from './prisma-client-exception.filter';

function createHost(response: Partial<Response>): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => response,
    }),
  } as ArgumentsHost;
}

describe('PrismaClientExceptionFilter', () => {
  let filter: PrismaClientExceptionFilter;
  let response: {
    status: jest.Mock;
    json: jest.Mock;
  };

  beforeEach(() => {
    filter = new PrismaClientExceptionFilter();
    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('maps P2002 to a 409 response without throwing', () => {
    filter.catch(
      {
        code: 'P2002',
      } as PrismaClientKnownRequestError,
      createHost(response as never),
    );

    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 409,
      message: 'A unique constraint would be violated by this operation.',
      error: 'Conflict',
    });
  });

  it('maps P2025 to a 404 response without throwing', () => {
    filter.catch(
      {
        code: 'P2025',
      } as PrismaClientKnownRequestError,
      createHost(response as never),
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 404,
      message: 'The requested record was not found.',
      error: 'Not Found',
    });
  });
});
