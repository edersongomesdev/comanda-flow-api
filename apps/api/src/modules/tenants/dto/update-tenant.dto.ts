import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: 'General Burguer' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'general-burguer' })
  @IsOptional()
  @IsString()
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
  @IsUrl()
  logoUrl?: string;

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
