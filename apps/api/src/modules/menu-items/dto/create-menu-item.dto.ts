import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateModifierGroupDto } from './create-modifier-group.dto';

export class CreateMenuItemDto {
  @ApiProperty({ example: 'x-salada' })
  @IsString()
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
  @IsString()
  categoryId!: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/burger.jpg' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

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
