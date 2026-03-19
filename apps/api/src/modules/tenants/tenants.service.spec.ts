import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PlanId } from '@prisma/client';
import { TenantsService } from './tenants.service';

describe('TenantsService', () => {
  const prisma = {
    tenant: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: TenantsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TenantsService(prisma as never);
  });

  it('rejects slugs that become empty after normalization', async () => {
    prisma.tenant.findUnique.mockResolvedValueOnce({
      id: 'tenant_123',
      slug: 'general-burguer',
      name: 'General Burguer',
      address: null,
      city: null,
      phone: null,
      whatsapp: null,
      hours: null,
      logoUrl: null,
      planId: PlanId.PREMIUM,
      trialEndsAt: null,
      maxTables: 0,
      deliveryAreas: [],
      paymentMethods: [],
    });

    await expect(
      service.updateMe('tenant_123', {
        slug: '!!!',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.tenant.update).not.toHaveBeenCalled();
  });

  it('rejects tenant slug conflicts with a clear error', async () => {
    prisma.tenant.findUnique
      .mockResolvedValueOnce({
        id: 'tenant_123',
        slug: 'general-burguer',
        name: 'General Burguer',
        address: null,
        city: null,
        phone: null,
        whatsapp: null,
        hours: null,
        logoUrl: null,
        planId: PlanId.PREMIUM,
        trialEndsAt: null,
        maxTables: 0,
        deliveryAreas: [],
        paymentMethods: [],
      })
      .mockResolvedValueOnce({
        id: 'tenant_999',
      });

    await expect(
      service.updateMe('tenant_123', {
        slug: 'Minha Loja',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.tenant.update).not.toHaveBeenCalled();
  });

  it('returns not found when the authenticated tenant no longer exists', async () => {
    prisma.tenant.findUnique.mockResolvedValue(null);

    await expect(service.getMe('tenant_missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
