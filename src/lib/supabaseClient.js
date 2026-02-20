// ─── SUPABASE CLIENT ───
// Singleton client for auth + database operations
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// ─── Diagnostic: verify env vars at startup ───
if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
        "[Supabase] ⚠️ Missing env vars!\n" +
        "  VITE_SUPABASE_URL:", supabaseUrl ? "✓ SET" : "✗ MISSING",
        "\n  VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? "✓ SET" : "✗ MISSING",
        "\n\nFix: add these to your .env file or Vercel environment variables."
    );
} else {
    console.log("[Supabase] ✓ Client configured, URL:", supabaseUrl);
}

// Only create client if credentials are configured
// IMPORTANT: explicitly set localStorage as storage so sessions survive
// page reloads — the default can be unreliable in some Vite/React setups
export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            storageKey: "blueprint-compiler-auth",
            storage: window.localStorage,
            autoRefreshToken: true,
            detectSessionInUrl: true,     // needed for OAuth redirect callbacks
        },
    })
    : null;

export const isSupabaseConfigured = () => !!supabase;
