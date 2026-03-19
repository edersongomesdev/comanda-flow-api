import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  emptyStringToNull,
  trimStringInput,
} from '../../../common/utils/dto-transforms';
import { CreateModifierOptionDto } from './create-modifier-option.dto';

export class CreateModifierGroupDto {
  @ApiProperty({ example: 'Adicionais' })
  @Transform(({ value }: { value: unknown }) => trimStringInput(value))
  @IsString()
  @IsNotEmpty({ message: 'name should not be empty.' })
  @MaxLength(120, {
    message: 'name must be shorter than or equal to 120 characters.',
  })
  name!: string;

  @ApiPropertyOptional({ example: 'Escolha os extras do lanche.' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => emptyStringToNull(value))
  @IsString()
  @MaxLength(240, {
    message: 'description must be shorter than or equal to 240 characters.',
  })
  description?: string | null;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  min?: number;

  @ApiPropertyOptional({ example: 3, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  max?: number;

  @ApiPropertyOptional({ example: 1, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiProperty({ type: [CreateModifierOptionDto] })
  @IsArray({ message: 'modifiers must be an array.' })
  @ArrayMinSize(1, { message: 'modifiers must contain at least 1 item.' })
  @ValidateNested({ each: true })
  @Type(() => CreateModifierOptionDto)
  modifiers!: CreateModifierOptionDto[];
}
