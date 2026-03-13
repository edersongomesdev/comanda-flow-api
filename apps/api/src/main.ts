import { ConfigService } from '@nestjs/config';
import { createApp } from './bootstrap-app';

async function bootstrap() {
  const app = await createApp();
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
}

void bootstrap();
