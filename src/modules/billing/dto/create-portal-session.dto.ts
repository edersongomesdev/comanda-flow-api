import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUrl } from 'class-validator';

export class CreatePortalSessionDto {
  @ApiPropertyOptional({ example: 'https://app.comandaflow.com/plans' })
  @IsOptional()
  @IsUrl()
  returnUrl?: string;
}
