// ─── AUTH CONTEXT ───
// Global auth state: user, session, loading
import { createContext, useContext, useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

const AuthContext = createContext({
    user: null,
    session: null,
    profile: null,
    loading: true,
    signUp: async () => { },
    signIn: async () => { },
    signInWithGoogle: async () => { },
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // ─── Init: check existing session ───
    useEffect(() => {
        if (!isSupabaseConfigured()) {
            setLoading(false);
            return;
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            setSession(s);
            setUser(s?.user ?? null);
            if (s?.user) fetchProfile(s.user.id);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, s) => {
                setSession(s);
                setUser(s?.user ?? null);
                if (s?.user) {
                    await fetchProfile(s.user.id);
                } else {
                    setProfile(null);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // ─── Fetch profile (with auto-create) ───
    async function fetchProfile(userId) {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (error && error.code === "PGRST116") {
            // Profile doesn't exist yet — create it
            const { data: newProfile } = await supabase
                .from("profiles")
                .insert({ id: userId, tier: "free" })
                .select()
                .single();
            setProfile(newProfile);
        } else {
            setProfile(data);
        }
    }

    // ─── Auth methods ───
    async function signUp(email, password) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        return data;
    }

    async function signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    }

    async function signInWithGoogle() {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: window.location.origin + "/app" },
        });
        if (error) throw error;
        return data;
    }

    async function signOut() {
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.warn("[Auth] signOut error (clearing local state anyway):", err.message);
        }
        // Always clear local state, even if Supabase call failed
        setUser(null);
        setSession(null);
        setProfile(null);
    }

    return (
        <AuthContext.Provider value={{
            user, session, profile, loading,
            signUp, signIn, signInWithGoogle, signOut,
        }}>
            {children}
        </AuthContext.Provider>
    );
}
