import {
  ConflictException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { SubscriptionStatus, UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { SupabaseAuthService } from './supabase-auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    userProfile: {
      create: jest.fn(),
      findUnique: jest.fn(),
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
      supabaseAuthService as unknown as SupabaseAuthService,
    );
    prisma.$transaction.mockImplementation(
      async (
        callback: (tx: {
          tenant: { create: typeof prisma.tenant.create };
          subscription: { create: typeof prisma.subscription.create };
          userProfile: { create: typeof prisma.userProfile.create };
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
        }),
    );
  });

  it('appends a numeric suffix when the derived tenant slug is already taken', async () => {
    prisma.tenant.findMany.mockResolvedValue([
      { slug: 'carlos-silva' },
      { slug: 'carlos-silva-2' },
    ]);
    prisma.tenant.create.mockResolvedValue({
      id: 'tenant_123',
      slug: 'carlos-silva-3',
      name: 'Carlos Silva',
      planId: 'MESA',
      trialEndsAt: new Date('2026-03-29T00:00:00.000Z'),
    });
    prisma.subscription.create.mockResolvedValue({
      id: 'subscription_123',
      status: SubscriptionStatus.TRIALING,
    });
    prisma.userProfile.create.mockResolvedValue({
      id: '0f0d6f8f-b3d1-4cb2-8d18-10e2ef2c4d8e',
      tenantId: 'tenant_123',
      name: 'Carlos Silva',
      role: UserRole.OWNER,
    });
    supabaseAuthService.createUser.mockResolvedValue({
      id: '0f0d6f8f-b3d1-4cb2-8d18-10e2ef2c4d8e',
    });

    await expect(
      service.register({
        name: 'Carlos Silva',
        email: 'Carlos@example.com',
        password: 'demo123',
        planId: 'MESA',
      }),
    ).resolves.toEqual({
      authProvider: 'supabase',
      user: {
        id: '0f0d6f8f-b3d1-4cb2-8d18-10e2ef2c4d8e',
        tenantId: 'tenant_123',
        name: 'Carlos Silva',
        email: 'carlos@example.com',
        role: UserRole.OWNER,
      },
      tenant: {
        id: 'tenant_123',
        slug: 'carlos-silva-3',
        name: 'Carlos Silva',
        planId: 'MESA',
        trialEndsAt: new Date('2026-03-29T00:00:00.000Z'),
      },
      subscription: {
        status: SubscriptionStatus.TRIALING,
      },
    });

    expect(supabaseAuthService.createUser).toHaveBeenCalledWith({
      email: 'carlos@example.com',
      password: 'demo123',
      name: 'Carlos Silva',
      role: UserRole.OWNER,
      tenantName: 'Carlos Silva',
      tenantSlug: 'carlos-silva-3',
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

    expect(supabaseAuthService.createUser).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('fails fast when Supabase admin provisioning is not configured', async () => {
    supabaseAuthService.isAdminConfigured.mockReturnValue(false);

    await expect(
      service.register({
        name: 'Carlos Silva',
        email: 'carlos@example.com',
        password: 'demo123',
        planId: 'MESA',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    expect(prisma.tenant.findMany).not.toHaveBeenCalled();
    expect(supabaseAuthService.createUser).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rolls back the Supabase user when the database transaction fails', async () => {
    const transactionError = new Error('database write failed');

    prisma.tenant.findMany.mockResolvedValue([]);
    prisma.$transaction.mockRejectedValue(transactionError);
    supabaseAuthService.createUser.mockResolvedValue({
      id: '0f0d6f8f-b3d1-4cb2-8d18-10e2ef2c4d8e',
    });

    await expect(
      service.register({
        name: 'Carlos Silva',
        email: 'carlos@example.com',
        password: 'demo123',
        planId: 'MESA',
      }),
    ).rejects.toThrow(transactionError);

    expect(supabaseAuthService.deleteUser).toHaveBeenCalledWith(
      '0f0d6f8f-b3d1-4cb2-8d18-10e2ef2c4d8e',
    );
  });

  it('returns the authenticated Supabase profile in getMe', async () => {
    prisma.userProfile.findUnique.mockResolvedValue({
      id: '0f0d6f8f-b3d1-4cb2-8d18-10e2ef2c4d8e',
      tenantId: 'tenant_123',
      name: 'Carlos Silva',
      role: UserRole.OWNER,
      createdAt: new Date('2026-03-15T00:00:00.000Z'),
      updatedAt: new Date('2026-03-15T00:00:00.000Z'),
    });

    await expect(
      service.getMe({
        userId: '0f0d6f8f-b3d1-4cb2-8d18-10e2ef2c4d8e',
        tenantId: 'tenant_123',
        email: 'carlos@example.com',
        role: UserRole.OWNER,
        authProvider: 'supabase',
      }),
    ).resolves.toEqual({
      id: '0f0d6f8f-b3d1-4cb2-8d18-10e2ef2c4d8e',
      tenantId: 'tenant_123',
      name: 'Carlos Silva',
      email: 'carlos@example.com',
      role: UserRole.OWNER,
      createdAt: new Date('2026-03-15T00:00:00.000Z'),
      updatedAt: new Date('2026-03-15T00:00:00.000Z'),
      authProvider: 'supabase',
    });
  });

  it('rejects getMe when the Supabase user has no internal profile', async () => {
    prisma.userProfile.findUnique.mockResolvedValue(null);

    await expect(
      service.getMe({
        userId: '0f0d6f8f-b3d1-4cb2-8d18-10e2ef2c4d8e',
        tenantId: 'tenant_123',
        email: 'carlos@example.com',
        role: UserRole.OWNER,
        authProvider: 'supabase',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
