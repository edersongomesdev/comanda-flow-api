import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PlanId } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import {
  normalizePlanIdInput,
  PLAN_INPUT_ALIASES,
} from '../../../common/utils/plan-features';

export class RegisterDto {
  @ApiProperty({ example: 'Carlos Silva' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'carlos@generalburguer.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 6, example: 'demo123' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ enum: PLAN_INPUT_ALIASES, example: 'MESA' })
  @Transform(
    ({ value }: { value: unknown }) => normalizePlanIdInput(value) ?? value,
  )
  @IsEnum(PlanId)
  planId!: PlanId;

  @ApiPropertyOptional({ example: 'General Burguer' })
  @IsOptional()
  @IsString()
  tenantName?: string;

  @ApiPropertyOptional({ example: 'general-burguer' })
  @IsOptional()
  @IsString()
  tenantSlug?: string;
}
