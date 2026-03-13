import { ConflictException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    subscription: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const jwtService = {
    sign: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      prisma as never,
      jwtService as unknown as JwtService,
    );
    prisma.$transaction.mockImplementation(
      async (
        callback: (tx: {
          tenant: { create: typeof prisma.tenant.create };
          subscription: { create: typeof prisma.subscription.create };
          user: { create: typeof prisma.user.create };
        }) => Promise<unknown>,
      ) =>
        callback({
          tenant: {
            create: prisma.tenant.create,
          },
          subscription: {
            create: prisma.subscription.create,
          },
          user: {
            create: prisma.user.create,
          },
        }),
    );
  });

  it('appends a numeric suffix when the derived tenant slug is already taken', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.tenant.findMany.mockResolvedValue([
      { slug: 'carlos-silva' },
      { slug: 'carlos-silva-2' },
    ]);
    prisma.tenant.create.mockResolvedValue({
      id: 'tenant_123',
    });
    prisma.subscription.create.mockResolvedValue({
      id: 'subscription_123',
    });
    prisma.user.create.mockResolvedValue({
      id: 'user_123',
      tenantId: 'tenant_123',
      name: 'Carlos Silva',
      email: 'carlos@example.com',
      role: UserRole.OWNER,
    });
    jwtService.sign.mockReturnValue('token_123');

    await expect(
      service.register({
        name: 'Carlos Silva',
        email: 'Carlos@example.com',
        password: 'demo123',
        planId: 'MESA',
      }),
    ).resolves.toEqual({
      accessToken: 'token_123',
      user: {
        id: 'user_123',
        tenantId: 'tenant_123',
        name: 'Carlos Silva',
        email: 'carlos@example.com',
        role: UserRole.OWNER,
      },
    });

    expect(prisma.tenant.findMany).toHaveBeenCalledWith({
      where: { slug: { startsWith: 'carlos-silva' } },
      select: { slug: true },
    });
    expect(prisma.tenant.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        slug: 'carlos-silva-3',
        name: 'Carlos Silva',
        planId: 'MESA',
        maxTables: 15,
      }),
    });
  });

  it('rejects an explicit tenant slug that is already in use', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant_existing',
    });

    await expect(
      service.register({
        name: 'Carlos Silva',
        email: 'carlos@example.com',
        password: 'demo123',
        planId: 'MESA',
        tenantSlug: 'general-burguer',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
