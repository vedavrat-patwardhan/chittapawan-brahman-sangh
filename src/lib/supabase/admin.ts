import { createClient } from "@supabase/supabase-js";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

/**
 * Prefer platform secret keys (`sb_secret_...`, env `SUPABASE_SECRET_KEY`).
 * Falls back to legacy JWT `service_role` (`SUPABASE_SERVICE_ROLE_KEY`).
 * Use only in Route Handlers, Server Actions, and other trusted server code.
 */
function requireSecretApiKey(): string {
  const next = process.env.SUPABASE_SECRET_KEY?.trim();
  if (next) return next;
  const legacy = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (legacy) return legacy;
  throw new Error(
    "Missing privileged Supabase key: set SUPABASE_SECRET_KEY (recommended, sb_secret_…) or SUPABASE_SERVICE_ROLE_KEY (legacy service_role JWT).",
  );
}

/** Bypasses RLS — server-only. Never import this into client bundles. */
export function createSupabaseAdmin() {
  return createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireSecretApiKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
