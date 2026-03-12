import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';

describe('HealthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.DATABASE_URL =
      process.env.DATABASE_URL ??
      'postgresql://postgres:postgres@localhost:5432/comanda_flow';
    process.env.DIRECT_URL = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
    process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';
    process.env.FRONTEND_URL =
      process.env.FRONTEND_URL ?? 'http://localhost:4173';

    const { AppModule } = await import('../src/app.module');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET)', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    const response = (await request(server)
      .get('/health')
      .expect(200)) as Response;
    const body = response.body as { status: string; service: string };

    expect(body.status).toBe('ok');
    expect(body.service).toBe('comanda-flow-api');
  });
});
