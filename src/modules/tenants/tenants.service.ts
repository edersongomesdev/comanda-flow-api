import { Injectable } from '@nestjs/common';
import { presentTenant } from '../../common/utils/present-tenant';
import { slugify } from '../../common/utils/slugify';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(tenantId: string) {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: {
        id: true,
        slug: true,
        name: true,
        address: true,
        city: true,
        phone: true,
        whatsapp: true,
        hours: true,
        logoUrl: true,
        planId: true,
        trialEndsAt: true,
        maxTables: true,
        deliveryAreas: true,
        paymentMethods: true,
      },
    });

    return presentTenant(tenant);
  }

  async updateMe(tenantId: string, dto: UpdateTenantDto) {
    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...dto,
        slug: dto.slug ? slugify(dto.slug) : undefined,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        address: true,
        city: true,
        phone: true,
        whatsapp: true,
        hours: true,
        logoUrl: true,
        planId: true,
        trialEndsAt: true,
        maxTables: true,
        deliveryAreas: true,
        paymentMethods: true,
      },
    });

    return presentTenant(tenant);
  }
}
