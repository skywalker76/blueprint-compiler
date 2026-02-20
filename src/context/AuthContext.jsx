// ─── AUTH CONTEXT ───
// Global auth state: user, session, profile, loading
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

const AuthContext = createContext({
    user: null,
    session: null,
    profile: null,
    loading: true,
    signUp: async () => { },
    signIn: async () => { },
    signInWithGoogle: async () => { },
    signInWithGitHub: async () => { },
    signOut: async () => { },
    refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // ─── Track if we're mounted (avoid StrictMode double-setState issues) ───
    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    // ─── Init: get existing session and set up listener ───
    useEffect(() => {
        if (!isSupabaseConfigured()) {
            setLoading(false);
            return;
        }

        let subscription = null;

        // 1. Get initial session synchronously
        supabase.auth.getSession().then(({ data: { session: s }, error }) => {
            if (!mounted.current) return;
            if (error) {
                console.error("[Auth] getSession error:", error.message);
            }
            setSession(s ?? null);
            setUser(s?.user ?? null);
            setLoading(false);
            // Non-blocking profile fetch — doesn't block user state
            if (s?.user) {
                fetchProfile(s.user.id).catch(err =>
                    console.warn("[Auth] Initial profile fetch failed (non-blocking):", err.message)
                );
            }
        });

        // 2. Listen for all future auth state changes
        const { data } = supabase.auth.onAuthStateChange((_event, s) => {
            if (!mounted.current) return;
            console.log("[Auth] onAuthStateChange:", _event, s?.user?.email ?? "no user");

            setSession(s ?? null);
            setUser(s?.user ?? null); // ← ALWAYS set user from session, independent of profile

            if (s?.user) {
                // Fetch profile non-blocking — profile failure doesn't affect login state
                fetchProfile(s.user.id).catch(err =>
                    console.warn("[Auth] Profile fetch failed (non-blocking):", err.message)
                );
            } else {
                setProfile(null);
            }
        });
        subscription = data.subscription;

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    // ─── Fetch profile (with auto-create for new users) ───
    async function fetchProfile(userId) {
        if (!isSupabaseConfigured()) return;
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();

            if (error && error.code === "PGRST116") {
                // Profile doesn't exist yet — create it
                const { data: newProfile, error: insertError } = await supabase
                    .from("profiles")
                    .insert({ id: userId, tier: "free" })
                    .select()
                    .single();
                if (insertError) {
                    console.warn("[Auth] Auto-create profile failed:", insertError.message);
                } else {
                    if (mounted.current) setProfile(newProfile);
                }
            } else if (error) {
                console.warn("[Auth] fetchProfile error:", error.message);
            } else {
                if (mounted.current) setProfile(data);
            }
        } catch (e) {
            console.warn("[Auth] fetchProfile exception:", e.message);
        }
    }

    // ─── Auth methods ───
    async function signUp(email, password) {
        if (!isSupabaseConfigured()) throw new Error("Auth not configured");
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        return data;
    }

    async function signIn(email, password) {
        if (!isSupabaseConfigured()) throw new Error("Auth not configured");
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Immediately update state — don't wait for onAuthStateChange
        if (data?.session) {
            setSession(data.session);
            setUser(data.session.user);
        }
        return data;
    }

    async function signInWithGoogle() {
        if (!isSupabaseConfigured()) throw new Error("Auth not configured");
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: window.location.origin + "/app" },
        });
        if (error) throw error;
        return data;
    }

    async function signInWithGitHub() {
        if (!isSupabaseConfigured()) throw new Error("Auth not configured");
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "github",
            options: { redirectTo: window.location.origin + "/app" },
        });
        if (error) throw error;
        return data;
    }

    async function signOut() {
        try {
            if (isSupabaseConfigured()) {
                const { error } = await supabase.auth.signOut();
                if (error) console.warn("[Auth] signOut Supabase error:", error.message);
            }
        } catch (err) {
            console.warn("[Auth] signOut exception:", err.message);
        }
        // Always clear local state regardless of Supabase result
        setUser(null);
        setSession(null);
        setProfile(null);
    }

    // ─── Refresh profile (call after checkout to pick up new tier) ───
    async function refreshProfile() {
        if (user?.id) {
            await fetchProfile(user.id);
        }
    }

    return (
        <AuthContext.Provider value={{
            user, session, profile, loading,
            signUp, signIn, signInWithGoogle, signInWithGitHub, signOut, refreshProfile,
        }}>
            {children}
        </AuthContext.Provider>
    );
}
