import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { presentMenuItem } from '../../common/utils/present-menu-item';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import { CreateModifierOptionDto } from './dto/create-modifier-option.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateModifierGroupDto } from './dto/update-modifier-group.dto';
import { UpdateModifierOptionDto } from './dto/update-modifier-option.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string) {
    const items = await this.prisma.menuItem.findMany({
      where: { tenantId },
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
    });

    return items.map((item) => presentMenuItem(item));
  }

  async create(tenantId: string, dto: CreateMenuItemDto) {
    await this.ensureCategoryOwnership(tenantId, dto.categoryId);
    this.validateModifierGroups(dto.modifierGroups);

    const menuItem = await this.prisma.$transaction(async (tx) => {
      const createdMenuItem = await tx.menuItem.create({
        data: {
          tenantId,
          categoryId: dto.categoryId,
          name: dto.name,
          description: dto.description,
          priceCents: dto.priceCents,
          imageUrl: dto.imageUrl,
          isBestSeller: dto.isBestSeller ?? false,
          isActive: dto.isActive ?? true,
        },
      });

      if (dto.modifierGroups?.length) {
        await this.syncModifierGroups(
          tx,
          tenantId,
          createdMenuItem.id,
          dto.modifierGroups,
        );
      }

      return createdMenuItem;
    });

    return this.findByIdOrThrow(tenantId, menuItem.id);
  }

  async update(tenantId: string, id: string, dto: UpdateMenuItemDto) {
    await this.ensureOwnership(tenantId, id);

    if (dto.categoryId) {
      await this.ensureCategoryOwnership(tenantId, dto.categoryId);
    }

    this.validateModifierGroups(dto.modifierGroups);

    await this.prisma.$transaction(async (tx) => {
      const { modifierGroups, ...menuItemData } = dto;

      await tx.menuItem.update({
        where: { id },
        data: menuItemData,
      });

      if (modifierGroups) {
        await this.syncModifierGroups(tx, tenantId, id, modifierGroups);
      }
    });

    return this.findByIdOrThrow(tenantId, id);
  }

  async remove(tenantId: string, id: string) {
    await this.ensureOwnership(tenantId, id);

    await this.prisma.$transaction(async (tx) => {
      const links = await tx.menuItemModifierGroup.findMany({
        where: { menuItemId: id },
        select: { modifierGroupId: true },
      });

      await tx.menuItem.delete({ where: { id } });

      for (const link of links) {
        const remainingLinks = await tx.menuItemModifierGroup.count({
          where: { modifierGroupId: link.modifierGroupId },
        });

        if (remainingLinks === 0) {
          await tx.modifierGroup.delete({
            where: { id: link.modifierGroupId },
          });
        }
      }
    });
  }

  private async ensureOwnership(tenantId: string, id: string) {
    const menuItem = await this.prisma.menuItem.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!menuItem) {
      throw new NotFoundException(
        `Menu item "${id}" was not found for this tenant.`,
      );
    }
  }

  private async ensureCategoryOwnership(tenantId: string, categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, tenantId },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException(
        `Category "${categoryId}" was not found for this tenant.`,
      );
    }
  }

  private async findByIdOrThrow(tenantId: string, id: string) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id, tenantId },
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
    });

    if (!item) {
      throw new NotFoundException(
        `Menu item "${id}" was not found for this tenant.`,
      );
    }

    return presentMenuItem(item);
  }

  private validateModifierGroups(
    modifierGroups?: CreateModifierGroupDto[] | UpdateModifierGroupDto[],
  ) {
    if (!modifierGroups) {
      return;
    }

    for (const group of modifierGroups) {
      const min = group.min ?? 0;
      const max = group.max ?? 1;

      if (max < min) {
        throw new BadRequestException(
          `Modifier group "${group.name}" cannot have max lower than min.`,
        );
      }
    }
  }

  private async syncModifierGroups(
    tx: Prisma.TransactionClient,
    tenantId: string,
    menuItemId: string,
    modifierGroups: CreateModifierGroupDto[] | UpdateModifierGroupDto[],
  ) {
    const previousLinks = await tx.menuItemModifierGroup.findMany({
      where: { menuItemId },
      select: { modifierGroupId: true },
    });

    await tx.menuItemModifierGroup.deleteMany({
      where: { menuItemId },
    });

    const preservedGroupIds = new Set<string>();

    for (const group of modifierGroups) {
      const modifierGroupId =
        'id' in group && group.id
          ? await this.updateModifierGroup(tx, tenantId, group)
          : await this.createModifierGroup(tx, tenantId, group);

      preservedGroupIds.add(modifierGroupId);

      await tx.menuItemModifierGroup.create({
        data: {
          menuItemId,
          modifierGroupId,
          sortOrder: group.sortOrder ?? 0,
        },
      });
    }

    for (const previousLink of previousLinks) {
      if (preservedGroupIds.has(previousLink.modifierGroupId)) {
        continue;
      }

      const remainingLinks = await tx.menuItemModifierGroup.count({
        where: { modifierGroupId: previousLink.modifierGroupId },
      });

      if (remainingLinks === 0) {
        await tx.modifierGroup.delete({
          where: { id: previousLink.modifierGroupId },
        });
      }
    }
  }

  private async createModifierGroup(
    tx: Prisma.TransactionClient,
    tenantId: string,
    group: CreateModifierGroupDto | UpdateModifierGroupDto,
  ) {
    const createdGroup = await tx.modifierGroup.create({
      data: {
        tenantId,
        name: group.name,
        description: group.description,
        isRequired: group.required ?? false,
        minSelections: group.min ?? 0,
        maxSelections: group.max ?? 1,
        sortOrder: group.sortOrder ?? 0,
        options: {
          create: this.mapModifierOptions(group.modifiers),
        },
      },
    });

    return createdGroup.id;
  }

  private async updateModifierGroup(
    tx: Prisma.TransactionClient,
    tenantId: string,
    group: UpdateModifierGroupDto,
  ) {
    const existingGroup = await tx.modifierGroup.findFirst({
      where: {
        id: group.id,
        tenantId,
      },
      select: { id: true },
    });

    if (!existingGroup) {
      throw new NotFoundException('Modifier group not found for this tenant.');
    }

    await tx.modifierGroup.update({
      where: { id: existingGroup.id },
      data: {
        name: group.name,
        description: group.description,
        isRequired: group.required ?? false,
        minSelections: group.min ?? 0,
        maxSelections: group.max ?? 1,
        sortOrder: group.sortOrder ?? 0,
        options: {
          deleteMany: {},
          create: this.mapModifierOptions(group.modifiers),
        },
      },
    });

    return existingGroup.id;
  }

  private mapModifierOptions(
    modifiers: CreateModifierOptionDto[] | UpdateModifierOptionDto[],
  ) {
    return modifiers.map(
      (
        modifier: CreateModifierOptionDto | UpdateModifierOptionDto,
        index: number,
      ) => ({
        name: modifier.name,
        priceCents: modifier.priceCents ?? 0,
        sortOrder: modifier.sortOrder ?? index,
        isActive: modifier.isActive ?? true,
      }),
    );
  }
}
