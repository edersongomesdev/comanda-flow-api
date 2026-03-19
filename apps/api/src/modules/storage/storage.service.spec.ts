import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  it('fails lazily when signed uploads are requested without Supabase service role configuration', async () => {
    const configService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'SUPABASE_URL':
            return 'https://example.supabase.co';
          case 'SUPABASE_STORAGE_BUCKET':
            return 'menu-assets';
          default:
            return undefined;
        }
      }),
    };

    const service = new StorageService(
      configService as unknown as ConfigService,
    );

    await expect(
      service.createUploadUrl('tenant_123', {
        kind: 'menu-item-image',
        filename: 'burger.png',
        contentType: 'image/png',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('returns enough metadata for the frontend to complete a signed upload', async () => {
    const configService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'SUPABASE_URL':
            return 'https://example.supabase.co';
          case 'SUPABASE_SERVICE_ROLE_KEY':
            return 'service-role-key';
          case 'SUPABASE_STORAGE_BUCKET':
            return 'menu-assets';
          default:
            return undefined;
        }
      }),
    };

    const createSignedUploadUrl = jest.fn().mockResolvedValue({
      data: {
        signedUrl:
          'https://example.supabase.co/storage/v1/object/upload/sign/menu-assets/tenants/tenant_123/menu-items/item.png?token=token_123',
        token: 'token_123',
        path: 'tenants/tenant_123/menu-items/item.png',
      },
      error: null,
    });

    const service = new StorageService(
      configService as unknown as ConfigService,
    );

    jest.spyOn(service as never, 'getSupabaseClient').mockReturnValue({
      storage: {
        from: jest.fn().mockReturnValue({
          createSignedUploadUrl,
        }),
      },
    } as never);

    await expect(
      service.createUploadUrl('tenant_123', {
        kind: 'menu-item-image',
        filename: 'burger.png',
        contentType: 'image/png',
      }),
    ).resolves.toEqual({
      bucket: 'menu-assets',
      path: 'tenants/tenant_123/menu-items/item.png',
      signedUrl:
        'https://example.supabase.co/storage/v1/object/upload/sign/menu-assets/tenants/tenant_123/menu-items/item.png?token=token_123',
      uploadUrl:
        'https://example.supabase.co/storage/v1/object/upload/sign/menu-assets/tenants/tenant_123/menu-items/item.png?token=token_123',
      uploadMethod: 'PUT',
      uploadHeaders: {
        'content-type': 'image/png',
        'x-upsert': 'false',
      },
      contentType: 'image/png',
      token: 'token_123',
      publicUrl:
        'https://example.supabase.co/storage/v1/object/public/menu-assets/tenants/tenant_123/menu-items/item.png',
    });
  });
});
