import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

export const cloudConfig = {
  configured: Boolean(supabaseUrl && supabaseAnonKey),
  provider: "Supabase",
};

export const supabase: SupabaseClient | null = cloudConfig.configured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    })
  : null;

export async function getCloudUser(): Promise<User | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }

  return data.user;
}

export async function signInWithEmail(email: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const emailRedirectTo = typeof window === "undefined" ? undefined : window.location.origin;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo,
    },
  });

  if (error) {
    throw error;
  }
}

export async function signOutCloud() {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export function onCloudAuthStateChange(callback: (user: User | null) => void) {
  if (!supabase) {
    return () => {};
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return () => data.subscription.unsubscribe();
}
