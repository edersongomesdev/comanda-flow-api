import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { CreateModifierGroupDto } from './create-modifier-group.dto';

export class CreateMenuItemDto {
  @ApiProperty({ example: 'x-salada' })
  @Transform(({ value }: { value: unknown }) => trimStringInput(value))
  @IsString()
  @IsNotEmpty({ message: 'name should not be empty.' })
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'Hamburguer com queijo e salada.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 2990, description: 'Price in cents.' })
  @IsInt()
  @Min(0)
  priceCents!: number;

  @ApiProperty({ example: 'cat_123' })
  @Transform(({ value }: { value: unknown }) => trimStringInput(value))
  @IsString()
  @IsNotEmpty({ message: 'categoryId should not be empty.' })
  categoryId!: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/burger.jpg' })
  @Transform(({ value }: { value: unknown }) => emptyStringToNull(value))
  @IsOptional()
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

  @ApiPropertyOptional({ type: [CreateModifierGroupDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateModifierGroupDto)
  modifierGroups?: CreateModifierGroupDto[];
}
