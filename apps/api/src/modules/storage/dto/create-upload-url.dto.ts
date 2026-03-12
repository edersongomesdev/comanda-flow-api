import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export const STORAGE_UPLOAD_KINDS = ['logo', 'menu-item-image'] as const;
export type StorageUploadKind = (typeof STORAGE_UPLOAD_KINDS)[number];

export const STORAGE_IMAGE_CONTENT_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;
export type StorageImageContentType =
  (typeof STORAGE_IMAGE_CONTENT_TYPES)[number];

export class CreateUploadUrlDto {
  @ApiProperty({ enum: STORAGE_UPLOAD_KINDS, example: 'menu-item-image' })
  @IsIn(STORAGE_UPLOAD_KINDS)
  kind!: StorageUploadKind;

  @ApiProperty({ example: 'burger.png' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  @Matches(/\.[A-Za-z0-9]+$/, {
    message: 'filename must include a valid file extension.',
  })
  filename!: string;

  @ApiProperty({ enum: STORAGE_IMAGE_CONTENT_TYPES, example: 'image/png' })
  @IsIn(STORAGE_IMAGE_CONTENT_TYPES)
  contentType!: StorageImageContentType;
}
