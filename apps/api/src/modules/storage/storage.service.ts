import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import {
  CreateUploadUrlDto,
  StorageImageContentType,
  StorageUploadKind,
} from './dto/create-upload-url.dto';

const STORAGE_DIRECTORIES: Record<StorageUploadKind, string> = {
  logo: 'logo',
  'menu-item-image': 'menu-items',
};

const MIME_TO_EXTENSIONS: Record<StorageImageContentType, readonly string[]> = {
  'image/png': ['png'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/webp': ['webp'],
};

const STORAGE_SIGNED_UPLOADS_UNAVAILABLE_MESSAGE =
  'Supabase Storage signed uploads are unavailable until SUPABASE_SERVICE_ROLE_KEY is configured.';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private supabaseClient?: SupabaseClient;

  constructor(private readonly configService: ConfigService) {}

  async createUploadUrl(tenantId: string, dto: CreateUploadUrlDto) {
    this.assertAdminConfigured();

    const filename = this.sanitizeFilename(dto.filename);
    const extension = this.extractExtension(filename);
    const expectedExtensions = MIME_TO_EXTENSIONS[dto.contentType];

    if (!expectedExtensions.includes(extension)) {
      throw new BadRequestException(
        `File extension .${extension} is not compatible with ${dto.contentType}.`,
      );
    }

    const path = this.buildObjectPath(tenantId, dto.kind, extension);
    const bucket = this.getStorageBucket();
    const { data, error } = await this.getSupabaseClient()
      .storage.from(bucket)
      .createSignedUploadUrl(path, {
        upsert: false,
      });

    if (error || !data?.signedUrl || !data.token) {
      this.logger.error(
        `Failed to create Supabase signed upload URL for tenant ${tenantId}: ${error?.message ?? 'Unknown error.'}`,
      );
      throw new InternalServerErrorException(
        'Could not create a signed upload URL for Supabase Storage.',
      );
    }

    return {
      path,
      uploadUrl: data.signedUrl,
      token: data.token,
      publicUrl: this.buildPublicUrl(bucket, path),
    };
  }

  private getSupabaseClient() {
    if (!this.supabaseClient) {
      this.assertAdminConfigured();

      const supabaseUrl = this.getRequiredConfigValue(
        'SUPABASE_URL',
        'Supabase URL is not configured.',
      );
      const serviceRoleKey = this.getRequiredConfigValue(
        'SUPABASE_SERVICE_ROLE_KEY',
        'Supabase service role key is not configured.',
      );

      this.supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }

    return this.supabaseClient;
  }

  private isAdminConfigured() {
    return Boolean(
      this.configService.get<string>('SUPABASE_URL')?.trim() &&
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')?.trim(),
    );
  }

  private assertAdminConfigured() {
    if (!this.isAdminConfigured()) {
      this.logger.error(STORAGE_SIGNED_UPLOADS_UNAVAILABLE_MESSAGE);
      throw new ServiceUnavailableException(
        STORAGE_SIGNED_UPLOADS_UNAVAILABLE_MESSAGE,
      );
    }
  }

  private getStorageBucket() {
    return this.getRequiredConfigValue(
      'SUPABASE_STORAGE_BUCKET',
      'Supabase storage bucket is not configured.',
    );
  }

  private getRequiredConfigValue(key: string, errorMessage: string) {
    const value = this.configService.get<string>(key)?.trim();

    if (!value) {
      this.logger.error(errorMessage);
      throw new InternalServerErrorException(errorMessage);
    }

    return value;
  }

  private sanitizeFilename(filename: string) {
    const sanitized = filename
      .normalize('NFKD')
      .replace(/[^\w.\-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^\.+/, '')
      .trim();

    if (!sanitized) {
      throw new BadRequestException('filename must not be empty.');
    }

    return sanitized;
  }

  private extractExtension(filename: string) {
    const extension = extname(filename).slice(1).toLowerCase();

    if (!extension) {
      throw new BadRequestException(
        'filename must include a supported file extension.',
      );
    }

    return extension;
  }

  private buildObjectPath(
    tenantId: string,
    kind: StorageUploadKind,
    extension: string,
  ) {
    return `tenants/${tenantId}/${STORAGE_DIRECTORIES[kind]}/${randomUUID()}.${extension}`;
  }

  private buildPublicUrl(bucket: string, path: string) {
    const supabaseUrl = this.getRequiredConfigValue(
      'SUPABASE_URL',
      'Supabase URL is not configured.',
    );

    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  }
}
