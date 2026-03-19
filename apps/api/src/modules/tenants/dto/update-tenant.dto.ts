import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { emptyStringToNull, trimStringInput } from '../../../common/utils/dto-transforms';

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: 'General Burguer' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => trimStringInput(value))
  @IsString()
  @IsNotEmpty({ message: 'name should not be empty.' })
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'general-burguer' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => trimStringInput(value))
  @IsString()
  @IsNotEmpty({ message: 'slug should not be empty.' })
  @MaxLength(120)
  slug?: string;

  @ApiPropertyOptional({ example: 'Rua Exemplo, 123' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Sao Paulo' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: '+55 11 4002-8922' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '+55 11 99999-9999' })
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiPropertyOptional({ example: 'Seg-Sab 18h-23h' })
  @IsOptional()
  @IsString()
  hours?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.png' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => emptyStringToNull(value))
  @IsUrl()
  logoUrl?: string | null;

  @ApiPropertyOptional({ type: [String], example: ['Centro', 'Jardins'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deliveryAreas?: string[];

  @ApiPropertyOptional({ type: [String], example: ['pix', 'credit-card'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paymentMethods?: string[];
}
