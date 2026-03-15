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
});
