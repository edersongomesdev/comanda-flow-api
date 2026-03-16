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
  SUPABASE_ANON_KEY?: string;
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

function readSupabaseProjectRefFromUrl(supabaseUrl: string) {
  try {
    const hostname = new URL(supabaseUrl).hostname;

    if (!hostname.endsWith('.supabase.co')) {
      return undefined;
    }

    return hostname.slice(0, -'.supabase.co'.length);
  } catch {
    return undefined;
  }
}

function readSupabaseProjectRefFromJwt(token?: string) {
  if (!token) {
    return undefined;
  }

  const [, payload] = token.split('.');

  if (!payload) {
    return undefined;
  }

  try {
    const decodedPayload = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as { ref?: unknown };

    return typeof decodedPayload.ref === 'string'
      ? decodedPayload.ref.trim() || undefined
      : undefined;
  } catch {
    return undefined;
  }
}

function assertSupabaseKeyMatchesUrl(
  keyName: 'SUPABASE_ANON_KEY' | 'SUPABASE_SERVICE_ROLE_KEY',
  keyValue: string | undefined,
  supabaseUrl: string,
) {
  const urlProjectRef = readSupabaseProjectRefFromUrl(supabaseUrl);
  const keyProjectRef = readSupabaseProjectRefFromJwt(keyValue);

  if (!urlProjectRef || !keyProjectRef) {
    return;
  }

  if (urlProjectRef !== keyProjectRef) {
    throw new Error(
      `Environment variable ${keyName} does not match SUPABASE_URL project ref (${urlProjectRef}).`,
    );
  }
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

  const supabaseUrl = readRequiredString(env, 'SUPABASE_URL');
  const supabaseAnonKey = readOptionalString(env, 'SUPABASE_ANON_KEY');
  const supabaseServiceRoleKey = readOptionalString(
    env,
    'SUPABASE_SERVICE_ROLE_KEY',
  );

  assertSupabaseKeyMatchesUrl(
    'SUPABASE_ANON_KEY',
    supabaseAnonKey,
    supabaseUrl,
  );
  assertSupabaseKeyMatchesUrl(
    'SUPABASE_SERVICE_ROLE_KEY',
    supabaseServiceRoleKey,
    supabaseUrl,
  );

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
    SUPABASE_URL: supabaseUrl,
    SUPABASE_ANON_KEY: supabaseAnonKey,
    SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey,
    SUPABASE_STORAGE_BUCKET:
      readOptionalString(env, 'SUPABASE_STORAGE_BUCKET') ?? 'menu-assets',
  };
}
