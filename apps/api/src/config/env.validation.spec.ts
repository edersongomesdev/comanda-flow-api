import { validateEnv } from './env.validation';

function makeJwtWithRef(ref: string, role: string) {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    'utf8',
  ).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ ref, role }), 'utf8').toString(
    'base64url',
  );

  return `${header}.${payload}.signature`;
}

function createBaseEnv() {
  return {
    PORT: '3001',
    NODE_ENV: 'test',
    FRONTEND_URL: 'http://localhost:4173',
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/comanda_flow',
    DIRECT_URL: 'postgresql://postgres:postgres@localhost:5432/comanda_flow',
    SUPABASE_URL: 'https://project-ref.supabase.co',
  };
}

describe('validateEnv', () => {
  it('allows boot without SUPABASE_ANON_KEY', () => {
    expect(() =>
      validateEnv({
        ...createBaseEnv(),
        SUPABASE_SERVICE_ROLE_KEY: makeJwtWithRef(
          'project-ref',
          'service_role',
        ),
      }),
    ).not.toThrow();
  });

  it('rejects a mismatched service role key', () => {
    expect(() =>
      validateEnv({
        ...createBaseEnv(),
        SUPABASE_SERVICE_ROLE_KEY: makeJwtWithRef(
          'different-project',
          'service_role',
        ),
      }),
    ).toThrow(
      'Environment variable SUPABASE_SERVICE_ROLE_KEY does not match SUPABASE_URL project ref (project-ref).',
    );
  });

  it('rejects a mismatched anon key', () => {
    expect(() =>
      validateEnv({
        ...createBaseEnv(),
        SUPABASE_ANON_KEY: makeJwtWithRef('different-project', 'anon'),
      }),
    ).toThrow(
      'Environment variable SUPABASE_ANON_KEY does not match SUPABASE_URL project ref (project-ref).',
    );
  });
});
