import { ForbiddenException } from '@nestjs/common';
import { TablesService } from './tables.service';

describe('TablesService', () => {
  const prisma = {
    tenant: {
      findUniqueOrThrow: jest.fn(),
    },
    table: {
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  let service: TablesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TablesService(prisma as never);
  });

  it('returns a friendly conflict when the table number already exists for the tenant', async () => {
    prisma.tenant.findUniqueOrThrow.mockResolvedValue({
      id: 'tenant_123',
      planId: 'MESA',
      maxTables: 0,
    });
    prisma.table.count.mockResolvedValue(3);
    prisma.table.findFirst.mockResolvedValue({ id: 'table_existing' });

    await expect(
      service.create('tenant_123', {
        number: 12,
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'TABLE_NUMBER_CONFLICT',
        field: 'number',
        message: 'Table number 12 is already in use for this tenant.',
      }),
    });

    expect(prisma.table.create).not.toHaveBeenCalled();
  });

  it('keeps enforcing the plan table limit before attempting creation', async () => {
    prisma.tenant.findUniqueOrThrow.mockResolvedValue({
      id: 'tenant_123',
      planId: 'MESA',
      maxTables: 2,
    });
    prisma.table.count.mockResolvedValue(2);

    await expect(
      service.create('tenant_123', {
        number: 3,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.table.findFirst).not.toHaveBeenCalled();
    expect(prisma.table.create).not.toHaveBeenCalled();
  });
});
