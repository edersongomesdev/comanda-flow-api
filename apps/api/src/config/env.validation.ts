type NodeEnv = 'development' | 'test' | 'production';

type EnvInput = Record<string, string | undefined>;

export interface EnvVariables {
  PORT: number;
  NODE_ENV: NodeEnv;
  FRONTEND_URL: string;
  FRONTEND_URLS?: string;
  FRONTEND_VERCEL_PROJECTS?: string;
  DATABASE_URL: string;
  DIRECT_URL: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_START?: string;
  STRIPE_PRICE_ESSENCIAL?: string;
  STRIPE_PRICE_MESA?: string;
  STRIPE_PRICE_PREMIUM?: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_STORAGE_BUCKET: string;
}

function readRequiredString(env: EnvInput, key: keyof EnvVariables): string {
  const value = env[key]?.trim();

  if (!value) {
    throw new Error(`Environment variable ${key} is required.`);
  }

  return value;
}

function readOptionalString(env: EnvInput, key: string) {
  const value = env[key]?.trim();

  return value ? value : undefined;
}

export function validateEnv(env: EnvInput): EnvVariables {
  const port = Number.parseInt(env.PORT ?? '3001', 10);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error('Environment variable PORT must be a positive number.');
  }

  const nodeEnv = (env.NODE_ENV ?? 'development') as NodeEnv;
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error(
      'Environment variable NODE_ENV must be development, test or production.',
    );
  }

  return {
    PORT: port,
    NODE_ENV: nodeEnv,
    FRONTEND_URL: env.FRONTEND_URL ?? 'http://localhost:4173',
    FRONTEND_URLS: readOptionalString(env, 'FRONTEND_URLS'),
    FRONTEND_VERCEL_PROJECTS: readOptionalString(
      env,
      'FRONTEND_VERCEL_PROJECTS',
    ),
    DATABASE_URL: readRequiredString(env, 'DATABASE_URL'),
    DIRECT_URL: readRequiredString(env, 'DIRECT_URL'),
    STRIPE_SECRET_KEY: readOptionalString(env, 'STRIPE_SECRET_KEY'),
    STRIPE_WEBHOOK_SECRET: readOptionalString(env, 'STRIPE_WEBHOOK_SECRET'),
    STRIPE_PRICE_START: readOptionalString(env, 'STRIPE_PRICE_START'),
    STRIPE_PRICE_ESSENCIAL:
      readOptionalString(env, 'STRIPE_PRICE_ESSENCIAL') ??
      readOptionalString(env, 'STRIPE_PRICE_PRO'),
    STRIPE_PRICE_MESA: readOptionalString(env, 'STRIPE_PRICE_MESA'),
    STRIPE_PRICE_PREMIUM:
      readOptionalString(env, 'STRIPE_PRICE_PREMIUM') ??
      readOptionalString(env, 'STRIPE_PRICE_ELITE'),
    SUPABASE_URL: readRequiredString(env, 'SUPABASE_URL'),
    SUPABASE_ANON_KEY: readRequiredString(env, 'SUPABASE_ANON_KEY'),
    SUPABASE_SERVICE_ROLE_KEY: readOptionalString(
      env,
      'SUPABASE_SERVICE_ROLE_KEY',
    ),
    SUPABASE_STORAGE_BUCKET:
      readOptionalString(env, 'SUPABASE_STORAGE_BUCKET') ?? 'menu-assets',
  };
}
