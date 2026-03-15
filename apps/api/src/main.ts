import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';
import { PrismaService } from './prisma/prisma.service';

const bootstrapLogger = new Logger('Bootstrap');

function normalizeOrigin(origin: string) {
  try {
    return new URL(origin).origin;
  } catch {
    return undefined;
  }
}

function parseCommaSeparatedValues(value?: string) {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function isAllowedVercelOrigin(origin: string, projectNames: string[]) {
  try {
    const { hostname, protocol } = new URL(origin);

    if (protocol !== 'https:' || !hostname.endsWith('.vercel.app')) {
      return false;
    }

    const deploymentName = hostname.slice(0, -'.vercel.app'.length);
    const normalizedDeploymentName = deploymentName.toLowerCase();

    return projectNames.some((projectName) => {
      const normalizedProjectName = projectName.toLowerCase();

      return (
        normalizedDeploymentName === normalizedProjectName ||
        normalizedDeploymentName.startsWith(`${normalizedProjectName}-`)
      );
    });
  } catch {
    return false;
  }
}

async function bootstrap() {
  bootstrapLogger.log(
    `Starting Comanda Flow API (NODE_ENV=${process.env.NODE_ENV ?? 'development'}).`,
  );

  try {
    const app = await NestFactory.create(AppModule, {
      rawBody: true,
    });
    const configService = app.get(ConfigService);
    const prismaService = app.get(PrismaService);
    const frontendUrl = configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:4173',
    );
    const frontendUrls = parseCommaSeparatedValues(
      configService.get<string>('FRONTEND_URLS'),
    );
    const vercelFrontendProjects = parseCommaSeparatedValues(
      configService.get<string>('FRONTEND_VERCEL_PROJECTS'),
    );
    const nodeEnv = configService.get<string>('NODE_ENV', 'development');
    const allowedOrigins = new Set(
      [
        'http://localhost:4173',
        'http://127.0.0.1:4173',
        'https://comandaflow.techmarque.com.br',
        frontendUrl,
        ...frontendUrls,
      ]
        .map((origin) => normalizeOrigin(origin))
        .filter((origin): origin is string => Boolean(origin)),
    );

    app.enableCors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        const normalizedOrigin = normalizeOrigin(origin);
        const originIsAllowed =
          Boolean(normalizedOrigin && allowedOrigins.has(normalizedOrigin)) ||
          (normalizedOrigin
            ? isAllowedVercelOrigin(normalizedOrigin, vercelFrontendProjects)
            : false);

        if (originIsAllowed) {
          callback(null, true);
          return;
        }

        callback(
          new Error(
            `CORS blocked for origin: ${origin}. Configure FRONTEND_URL, FRONTEND_URLS or FRONTEND_VERCEL_PROJECTS accordingly.`,
          ),
        );
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
        .setDescription(
          'Production-oriented backend for the Comanda Flow SaaS.',
        )
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();

      const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
      SwaggerModule.setup('docs', app, swaggerDocument);
      bootstrapLogger.log('Swagger available at /docs.');
    }

    prismaService.enableShutdownHooks(app);
    const port = configService.get<number>('PORT', 3001);
    await app.listen(port);
    bootstrapLogger.log(`API listening on port ${port}.`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown bootstrap failure.';
    const stack = error instanceof Error ? error.stack : undefined;

    bootstrapLogger.error(`Application failed to start: ${message}`, stack);
    process.exit(1);
  }
}

void bootstrap();
