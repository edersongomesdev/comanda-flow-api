export default () => ({
  PORT: Number.parseInt(process.env.PORT ?? '3001', 10),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:4173',
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  DIRECT_URL: process.env.DIRECT_URL ?? '',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  STRIPE_PRICE_START: process.env.STRIPE_PRICE_START ?? '',
  STRIPE_PRICE_ESSENCIAL:
    process.env.STRIPE_PRICE_ESSENCIAL ?? process.env.STRIPE_PRICE_PRO ?? '',
  STRIPE_PRICE_MESA: process.env.STRIPE_PRICE_MESA ?? '',
  STRIPE_PRICE_PREMIUM:
    process.env.STRIPE_PRICE_PREMIUM ?? process.env.STRIPE_PRICE_ELITE ?? '',
  SUPABASE_URL: process.env.SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET ?? 'menu-assets',
});
