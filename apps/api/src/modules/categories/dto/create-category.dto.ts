import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Burgers',
    description: 'Category name shown in the admin and public menu.',
  })
  @Transform(({ value }: { value: unknown }) => trimStringInput(value))
  @IsString()
  @IsNotEmpty({ message: 'name should not be empty.' })
  @MaxLength(120, {
    message: 'name must be shorter than or equal to 120 characters.',
  })
  name!: string;

  @ApiPropertyOptional({
    example: 'burger',
    description: 'Optional category icon token.',
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
    example: 1,
    default: 0,
    description: 'Display order used when listing categories.',
  })
  @IsOptional()
  @IsInt({ message: 'sortOrder must be an integer number.' })
  @Min(0, { message: 'sortOrder must not be less than 0.' })
  sortOrder?: number;
}
