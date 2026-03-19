import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { emptyStringToNull, trimStringInput } from '../../../common/utils/dto-transforms';
import { UpdateModifierGroupDto } from './update-modifier-group.dto';

export class UpdateMenuItemDto {
  @ApiPropertyOptional({ example: 'x-bacon' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => trimStringInput(value))
  @IsString()
  @IsNotEmpty({ message: 'name should not be empty.' })
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'Hamburguer, bacon e cheddar.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 3290 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number;

  @ApiPropertyOptional({ example: 'cat_456' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => trimStringInput(value))
  @IsString()
  @IsNotEmpty({ message: 'categoryId should not be empty.' })
  categoryId?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/burger.jpg' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => emptyStringToNull(value))
  @IsUrl()
  imageUrl?: string | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isBestSeller?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [UpdateModifierGroupDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateModifierGroupDto)
  modifierGroups?: UpdateModifierGroupDto[];
}
