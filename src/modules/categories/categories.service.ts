import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.category.findMany({
      where: { tenantId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  create(tenantId: string, dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        tenantId,
        name: dto.name,
        icon: dto.icon,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateCategoryDto) {
    await this.ensureOwnership(tenantId, id);

    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.ensureOwnership(tenantId, id);
    await this.prisma.category.delete({ where: { id } });
  }

  private async ensureOwnership(tenantId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found for this tenant.');
    }
  }
}
