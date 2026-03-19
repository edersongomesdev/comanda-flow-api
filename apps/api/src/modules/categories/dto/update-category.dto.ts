import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  emptyStringToNull,
  trimStringInput,
} from '../../../common/utils/dto-transforms';

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    example: 'Combos',
    description: 'Updated category name.',
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
    example: 'flame',
    description: 'Updated category icon token.',
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => emptyStringToNull(value))
  @IsString()
  @MaxLength(50, {
    message: 'icon must be shorter than or equal to 50 characters.',
  })
  icon?: string | null;

  @ApiPropertyOptional({
    example: 2,
    description: 'Updated display order for the category list.',
  })
  @IsOptional()
  @IsInt({ message: 'sortOrder must be an integer number.' })
  @Min(0, { message: 'sortOrder must not be less than 0.' })
  sortOrder?: number;
}
