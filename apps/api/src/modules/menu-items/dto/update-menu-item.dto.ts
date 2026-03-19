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
import {
  emptyStringToNull,
  trimStringInput,
} from '../../../common/utils/dto-transforms';
import { UpdateModifierGroupDto } from './update-modifier-group.dto';

export class UpdateMenuItemDto {
  @ApiPropertyOptional({
    example: 'x-bacon',
    description: 'Updated menu item name.',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => trimStringInput(value))
  @IsString()
  @IsNotEmpty({ message: 'name should not be empty.' })
  @MaxLength(120, {
    message: 'name must be shorter than or equal to 120 characters.',
  })
  name?: string;

  @ApiPropertyOptional({
    example: 'Hamburguer, bacon e cheddar.',
    description: 'Updated description. Send null to clear the field.',
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => emptyStringToNull(value))
  @IsString()
  @MaxLength(500, {
    message: 'description must be shorter than or equal to 500 characters.',
  })
  description?: string | null;

  @ApiPropertyOptional({
    example: 3290,
    description: 'Updated price in cents.',
  })
  @IsOptional()
  @IsInt({ message: 'priceCents must be an integer number of cents.' })
  @Min(0, { message: 'priceCents must not be less than 0.' })
  priceCents?: number;

  @ApiPropertyOptional({
    example: 'cat_456',
    description:
      'Updated category id. It must belong to the authenticated tenant.',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => trimStringInput(value))
  @IsString()
  @IsNotEmpty({ message: 'categoryId should not be empty.' })
  categoryId?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/burger.jpg',
    description:
      'Updated public image URL. Send null to remove the current image.',
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => emptyStringToNull(value))
  @IsUrl({}, { message: 'imageUrl must be a valid URL when provided.' })
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
  @IsArray({ message: 'modifierGroups must be an array when provided.' })
  @ValidateNested({ each: true })
  @Type(() => UpdateModifierGroupDto)
  modifierGroups?: UpdateModifierGroupDto[];
}
