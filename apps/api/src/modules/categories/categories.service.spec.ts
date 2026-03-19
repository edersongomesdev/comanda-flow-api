import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  const prisma = {
    category: {
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    menuItem: {
      count: jest.fn(),
    },
  };

  let service: CategoriesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CategoriesService(prisma as never);
  });

  it('rejects category deletion when menu items still reference it', async () => {
    prisma.category.findFirst.mockResolvedValue({ id: 'cat_123' });
    prisma.menuItem.count.mockResolvedValue(2);

    await expect(service.remove('tenant_123', 'cat_123')).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(prisma.category.delete).not.toHaveBeenCalled();
  });

  it('returns not found when the category does not belong to the tenant', async () => {
    prisma.category.findFirst.mockResolvedValue(null);

    await expect(service.remove('tenant_123', 'cat_123')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(prisma.menuItem.count).not.toHaveBeenCalled();
    expect(prisma.category.delete).not.toHaveBeenCalled();
  });
});
