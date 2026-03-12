import { ApiProperty } from '@nestjs/swagger';
import { PlanId } from '@prisma/client';

class DashboardTopItemDto {
  @ApiProperty({ example: 'Smash Clássico' })
  name!: string;

  @ApiProperty({ example: 0 })
  clicks!: number;
}

class DashboardSourceDto {
  @ApiProperty({ example: 'QR' })
  name!: string;

  @ApiProperty({ example: 0 })
  value!: number;
}

export class DashboardSummaryDto {
  @ApiProperty({ example: 5 })
  trialDaysLeft!: number;

  @ApiProperty({ example: 'MESA' })
  planId!: PlanId;

  @ApiProperty({ example: 4 })
  menuItemsCount!: number;

  @ApiProperty({ example: 2 })
  tablesCount!: number;

  @ApiProperty({ example: 0 })
  clicksLast7Days!: number;

  @ApiProperty({ type: [DashboardTopItemDto], example: [] })
  topItems!: DashboardTopItemDto[];

  @ApiProperty({ type: [DashboardSourceDto], example: [] })
  sources!: DashboardSourceDto[];
}
