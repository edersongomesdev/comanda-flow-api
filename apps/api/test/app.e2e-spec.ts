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
    process.env.FRONTEND_URL =
      process.env.FRONTEND_URL ?? 'http://localhost:4173';
    process.env.SUPABASE_URL =
      process.env.SUPABASE_URL ?? 'https://example.supabase.co';
    process.env.SUPABASE_ANON_KEY =
      process.env.SUPABASE_ANON_KEY ?? 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';

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

  it('/auth/login (POST) returns 410 Gone', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .post('/auth/login')
      .send({
        email: 'owner@example.com',
        password: 'secret123',
      })
      .expect(410);
  });

  it('/auth/me (GET) requires a bearer token', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server).get('/auth/me').expect(401);
  });

  it('/auth/register (POST) returns 503 when Supabase admin is not configured', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .post('/auth/register')
      .send({
        name: 'Carlos Silva',
        email: 'carlos@example.com',
        password: 'demo123',
        planId: 'MESA',
      })
      .expect(503);
  });
});
