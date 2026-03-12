import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  const configService = app.get(ConfigService);
  const prismaService = app.get(PrismaService);
  const frontendUrl = configService.get<string>(
    'FRONTEND_URL',
    'http://localhost:4173',
  );
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const allowedOrigins = new Set([
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    'https://comandaflow.techmarque.com.br',
    frontendUrl,
  ]);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new PrismaClientExceptionFilter());

  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Comanda Flow API')
      .setDescription('Production-oriented backend for the Comanda Flow SaaS.')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, swaggerDocument);
  }

  prismaService.enableShutdownHooks(app);

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
}

void bootstrap();
