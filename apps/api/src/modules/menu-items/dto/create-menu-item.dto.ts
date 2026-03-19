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
import {
  emptyStringToNull,
  trimStringInput,
} from '../../../common/utils/dto-transforms';
import { CreateModifierGroupDto } from './create-modifier-group.dto';

export class CreateMenuItemDto {
  @ApiProperty({
    example: 'x-salada',
    description: 'Menu item name shown to customers.',
  })
  @Transform(({ value }: { value: unknown }) => trimStringInput(value))
  @IsString()
  @IsNotEmpty({ message: 'name should not be empty.' })
  @MaxLength(120, {
    message: 'name must be shorter than or equal to 120 characters.',
  })
  name!: string;

  @ApiPropertyOptional({
    example: 'Hamburguer com queijo e salada.',
    description:
      'Optional menu item description. Send null or omit it when absent.',
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => emptyStringToNull(value))
  @IsString()
  @MaxLength(500, {
    message: 'description must be shorter than or equal to 500 characters.',
  })
  description?: string | null;

  @ApiProperty({
    example: 2990,
    description: 'Price in cents. Example: R$ 29,90 must be sent as 2990.',
  })
  @IsInt({ message: 'priceCents must be an integer number of cents.' })
  @Min(0, { message: 'priceCents must not be less than 0.' })
  priceCents!: number;

  @ApiProperty({
    example: 'cat_123',
    description:
      'Existing category id that belongs to the authenticated tenant.',
  })
  @Transform(({ value }: { value: unknown }) => trimStringInput(value))
  @IsString()
  @IsNotEmpty({ message: 'categoryId should not be empty.' })
  categoryId!: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/burger.jpg',
    description:
      'Optional public image URL. Omit it or send null to create without image.',
    nullable: true,
  })
  @Transform(({ value }: { value: unknown }) => emptyStringToNull(value))
  @IsOptional()
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

  @ApiPropertyOptional({ type: [CreateModifierGroupDto] })
  @IsOptional()
  @IsArray({ message: 'modifierGroups must be an array when provided.' })
  @ValidateNested({ each: true })
  @Type(() => CreateModifierGroupDto)
  modifierGroups?: CreateModifierGroupDto[];
}
