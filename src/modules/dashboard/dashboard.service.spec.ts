import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  const prisma = {
    tenant: {
      findUniqueOrThrow: jest.fn(),
    },
    menuItem: {
      count: jest.fn(),
    },
    table: {
      count: jest.fn(),
    },
    event: {
      count: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    service = new DashboardService(prisma as never);
  });

  it('returns a stable frontend-ready summary for the authenticated tenant', async () => {
    jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-03-11T12:00:00.000Z').getTime());

    prisma.tenant.findUniqueOrThrow.mockResolvedValue({
      planId: 'MESA',
      trialEndsAt: new Date('2026-03-16T12:00:00.000Z'),
    });
    prisma.menuItem.count.mockResolvedValue(4);
    prisma.table.count.mockResolvedValue(2);
    prisma.event.count.mockResolvedValue(7);

    await expect(service.getSummary('tenant_123')).resolves.toEqual({
      trialDaysLeft: 5,
      planId: 'MESA',
      menuItemsCount: 4,
      tablesCount: 2,
      clicksLast7Days: 7,
      topItems: [],
      sources: [],
    });

    expect(prisma.tenant.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'tenant_123' },
      select: {
        planId: true,
        trialEndsAt: true,
      },
    });
    expect(prisma.menuItem.count).toHaveBeenCalledWith({
      where: { tenantId: 'tenant_123' },
    });
    expect(prisma.table.count).toHaveBeenCalledWith({
      where: { tenantId: 'tenant_123' },
    });
    expect(prisma.event.count).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant_123',
        createdAt: {
          gte: expect.any(Date),
        },
      },
    });
  });
});
