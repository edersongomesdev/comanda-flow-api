import { Injectable } from '@nestjs/common';
import { calculateTrialDaysLeft } from '../../common/utils/trial-days-left';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(tenantId: string): Promise<DashboardSummaryDto> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [tenant, menuItemsCount, tablesCount, clicksLast7Days] =
      await Promise.all([
        this.prisma.tenant.findUniqueOrThrow({
          where: { id: tenantId },
          select: {
            planId: true,
            trialEndsAt: true,
          },
        }),
        this.prisma.menuItem.count({ where: { tenantId } }),
        this.prisma.table.count({ where: { tenantId } }),
        this.prisma.event.count({
          where: {
            tenantId,
            createdAt: {
              gte: sevenDaysAgo,
            },
          },
        }),
      ]);

    return {
      trialDaysLeft: calculateTrialDaysLeft(tenant.trialEndsAt),
      menuItemsCount,
      tablesCount,
      planId: tenant.planId,
      topItems: [],
      sources: [],
      clicksLast7Days,
    };
  }
}
