import { Injectable, NotFoundException } from '@nestjs/common';
import { presentMenuItem } from '../../common/utils/present-menu-item';
import { presentTenant } from '../../common/utils/present-tenant';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  async getMenu(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
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

    if (!tenant) {
      throw new NotFoundException('Public menu not found for this slug.');
    }

    // TODO: add POST /public/:slug/events ingestion once analytics tracking is enabled.
    const [categories, items] = await Promise.all([
      this.prisma.category.findMany({
        where: { tenantId: tenant.id },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.menuItem.findMany({
        where: { tenantId: tenant.id, isActive: true },
        orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
        include: {
          modifierGroupLinks: {
            orderBy: { sortOrder: 'asc' },
            include: {
              modifierGroup: {
                include: {
                  options: {
                    orderBy: { sortOrder: 'asc' },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      tenant: presentTenant(tenant),
      categories,
      items: items.map((item) => presentMenuItem(item, { publicView: true })),
    };
  }
}
