import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { getPlanFeatures } from '../../common/utils/plan-features';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTableDto } from './dto/create-table.dto';

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.table.findMany({
      where: { tenantId },
      orderBy: { number: 'asc' },
    });
  }

  async create(tenantId: string, dto: CreateTableDto) {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: {
        id: true,
        planId: true,
        maxTables: true,
      },
    });

    const features = getPlanFeatures(tenant.planId);
    if (!features.tables) {
      throw new ForbiddenException('The current plan does not allow tables.');
    }

    const currentTables = await this.prisma.table.count({
      where: { tenantId },
    });
    const maxTables =
      tenant.maxTables > 0 ? tenant.maxTables : features.maxTables;

    if (currentTables >= maxTables) {
      throw new ForbiddenException(
        `The current plan allows up to ${maxTables} tables.`,
      );
    }

    return this.prisma.table.create({
      data: {
        tenantId,
        number: dto.number,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const table = await this.prisma.table.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!table) {
      throw new NotFoundException('Table not found for this tenant.');
    }

    await this.prisma.table.delete({ where: { id } });
  }
}
