import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreateTableDto {
  @ApiProperty({
    example: 12,
    description: 'Table number. It must be unique per tenant.',
  })
  @IsInt({ message: 'number must be an integer.' })
  @Min(1, { message: 'number must be greater than or equal to 1.' })
  number!: number;
}
