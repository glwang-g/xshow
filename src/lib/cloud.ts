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

export type CloudWorkspaceRecord<TWorkspace = unknown> = {
  created_at: string;
  id: string;
  title: string;
  updated_at: string;
  workspace: TWorkspace;
};

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

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
  const client = requireSupabase();

  const emailRedirectTo = typeof window === "undefined" ? undefined : window.location.origin;
  const { error } = await client.auth.signInWithOtp({
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

export async function listCloudWorkspaceRecords<TWorkspace>() {
  const { data, error } = await requireSupabase()
    .from("workspace_records")
    .select("id,title,workspace,created_at,updated_at")
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }

  return (data ?? []) as CloudWorkspaceRecord<TWorkspace>[];
}

export async function saveCloudWorkspaceRecord<TWorkspace>(title: string, workspace: TWorkspace) {
  const { data, error } = await requireSupabase()
    .from("workspace_records")
    .insert({
      title,
      workspace,
    })
    .select("id,title,workspace,created_at,updated_at")
    .single();

  if (error) {
    throw error;
  }

  return data as CloudWorkspaceRecord<TWorkspace>;
}

export async function deleteCloudWorkspaceRecord(recordId: string) {
  const { error } = await requireSupabase().from("workspace_records").delete().eq("id", recordId);

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
