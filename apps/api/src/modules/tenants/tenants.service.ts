import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { presentTenant } from '../../common/utils/present-tenant';
import { slugify } from '../../common/utils/slugify';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(tenantId: string) {
    const tenant = await this.findTenantByIdOrThrow(tenantId);

    return presentTenant(tenant);
  }

  async updateMe(tenantId: string, dto: UpdateTenantDto) {
    await this.findTenantByIdOrThrow(tenantId);

    let slug: string | undefined;
    if (dto.slug !== undefined) {
      slug = slugify(dto.slug);

      if (!slug) {
        throw new BadRequestException(
          'slug must contain at least one letter or number.',
        );
      }

      const existingTenant = await this.prisma.tenant.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (existingTenant && existingTenant.id !== tenantId) {
        throw new ConflictException('This slug is already in use.');
      }
    }

    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...dto,
        slug,
      },
      select: tenantSelect,
    });

    return presentTenant(tenant);
  }

  private async findTenantByIdOrThrow(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: tenantSelect,
    });

    if (!tenant) {
      throw new NotFoundException('Authenticated tenant was not found.');
    }

    return tenant;
  }
}

const tenantSelect = {
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
} as const;
