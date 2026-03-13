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
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'carlos@generalburguer.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
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
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  tenantName?: string;

  @ApiPropertyOptional({ example: 'general-burguer' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  tenantSlug?: string;
}
