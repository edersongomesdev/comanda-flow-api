import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";

type AuthStateListener = (event: string, session: Session | null) => void;

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
