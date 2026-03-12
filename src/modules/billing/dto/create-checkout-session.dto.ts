import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PlanId } from '@prisma/client';
import { IsEnum, IsOptional, IsUrl } from 'class-validator';
import {
  normalizePlanIdInput,
  PLAN_INPUT_ALIASES,
} from '../../../common/utils/plan-features';

export class CreateCheckoutSessionDto {
  @ApiProperty({ enum: PLAN_INPUT_ALIASES, example: 'PREMIUM' })
  @Transform(
    ({ value }: { value: unknown }) => normalizePlanIdInput(value) ?? value,
  )
  @IsEnum(PlanId)
  planId!: PlanId;

  @ApiPropertyOptional({
    example: 'https://app.comandaflow.com/plans?success=1',
  })
  @IsOptional()
  @IsUrl()
  successUrl?: string;

  @ApiPropertyOptional({
    example: 'https://app.comandaflow.com/plans?canceled=1',
  })
  @IsOptional()
  @IsUrl()
  cancelUrl?: string;
}
