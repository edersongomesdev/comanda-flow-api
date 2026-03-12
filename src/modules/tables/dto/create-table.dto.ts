import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreateTableDto {
  @ApiProperty({ example: 12 })
  @IsInt()
  @Min(1)
  number!: number;
}
