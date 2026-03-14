import {
  AuthApiError,
  type AuthChangeEvent,
  createClient,
  type Session,
  type SupabaseClient,
} from "@supabase/supabase-js";

type AuthStateListener = (event: AuthChangeEvent, session: Session | null) => void;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

let supabaseClient: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return supabaseClient;
}

function getRequiredSupabaseClient() {
  const client = getSupabaseClient();

  if (!client) {
    throw new Error("Supabase Auth nao esta configurado.");
  }

  return client;
}

function buildAppUrl(pathname: string) {
  const baseUrl =
    import.meta.env.VITE_APP_URL?.trim() ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:4173");
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;

  return `${normalizedBase}${normalizedPath}`;
}

function normalizeAuthErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof AuthApiError && error.message.trim()) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

export async function getSupabaseAccessToken() {
  const client = getSupabaseClient();

  if (!client) {
    return null;
  }

  const { data, error } = await client.auth.getSession();

  if (error) {
    return null;
  }

  return data.session?.access_token ?? null;
}

export async function getSupabaseSession() {
  const client = getSupabaseClient();

  if (!client) {
    return null;
  }

  const { data, error } = await client.auth.getSession();

  if (error) {
    return null;
  }

  return data.session ?? null;
}

export async function signInWithSupabasePassword(email: string, password: string) {
  const client = getRequiredSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    throw new Error(normalizeAuthErrorMessage(error, "Nao foi possivel autenticar com o Supabase."));
  }

  if (!data.session?.access_token) {
    throw new Error("O Supabase nao retornou uma sessao valida.");
  }

  return data.session;
}

export async function sendPasswordResetEmail(email: string) {
  const client = getRequiredSupabaseClient();
  const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: buildAppUrl("/auth/reset-password"),
  });

  if (error) {
    throw new Error(normalizeAuthErrorMessage(error, "Nao foi possivel enviar o email de recuperacao."));
  }
}

export async function updateSupabasePassword(password: string) {
  const client = getRequiredSupabaseClient();
  const { data, error } = await client.auth.updateUser({ password });

  if (error) {
    throw new Error(normalizeAuthErrorMessage(error, "Nao foi possivel atualizar a senha."));
  }

  if (!data.user) {
    throw new Error("O Supabase nao retornou o usuario apos atualizar a senha.");
  }

  return data.user;
}

export async function signOutSupabaseSession() {
  const client = getSupabaseClient();

  if (!client) {
    return;
  }

  await client.auth.signOut();
}

export function subscribeToSupabaseAuth(listener: AuthStateListener) {
  const client = getSupabaseClient();

  if (!client) {
    return () => undefined;
  }

  const {
    data: { subscription },
  } = client.auth.onAuthStateChange((event, session) => {
    listener(event, session);
  });

  return () => {
    subscription.unsubscribe();
  };
}
