import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { UpdateModifierOptionDto } from './update-modifier-option.dto';

export class UpdateModifierGroupDto {
  @ApiPropertyOptional({ example: 'mg_123' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Adicionais' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'Escolha os extras do lanche.' })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string;

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

  @ApiProperty({ type: [UpdateModifierOptionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateModifierOptionDto)
  modifiers!: UpdateModifierOptionDto[];
}
