import { ConflictException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { SupabaseAuthService } from './supabase-auth.service';

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
    userProfile: {
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
  const supabaseAuthService = {
    isAdminConfigured: jest.fn(),
    createUser: jest.fn(),
    deleteUser: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    supabaseAuthService.isAdminConfigured.mockReturnValue(true);
    service = new AuthService(
      prisma as never,
      jwtService as unknown as JwtService,
      supabaseAuthService as unknown as SupabaseAuthService,
    );
    prisma.$transaction.mockImplementation(
      async (
        callback: (tx: {
          tenant: { create: typeof prisma.tenant.create };
          subscription: { create: typeof prisma.subscription.create };
          userProfile: { create: typeof prisma.userProfile.create };
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
          userProfile: {
            create: prisma.userProfile.create,
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
    prisma.userProfile.create.mockResolvedValue({
      id: '0f0d6f8f-b3d1-4cb2-8d18-10e2ef2c4d8e',
    });
    prisma.user.create.mockResolvedValue({
      id: 'user_123',
      tenantId: 'tenant_123',
      name: 'Carlos Silva',
      email: 'carlos@example.com',
      role: UserRole.OWNER,
    });
    supabaseAuthService.createUser.mockResolvedValue({
      id: '0f0d6f8f-b3d1-4cb2-8d18-10e2ef2c4d8e',
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
    supabaseAuthService.createUser.mockResolvedValue({
      id: '0f0d6f8f-b3d1-4cb2-8d18-10e2ef2c4d8e',
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

  it('falls back to legacy registration when Supabase Admin is not configured', async () => {
    supabaseAuthService.isAdminConfigured.mockReturnValue(false);
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.tenant.findMany.mockResolvedValue([]);
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
        email: 'carlos@example.com',
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

    expect(supabaseAuthService.createUser).not.toHaveBeenCalled();
    expect(prisma.userProfile.create).not.toHaveBeenCalled();
    expect(supabaseAuthService.deleteUser).not.toHaveBeenCalled();
  });
});
