// ─── AUTH MODAL ───
// Login / Sign-up modal with email + optional Google OAuth
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export function AuthModal({ onClose }) {
    const { signIn, signUp, signInWithGoogle } = useAuth();
    const [mode, setMode] = useState("login"); // "login" | "signup"
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            if (mode === "signup") {
                await signUp(email, password);
                setSuccess("Check your email to confirm your account!");
            } else {
                await signIn(email, password);
                onClose?.();
            }
        } catch (err) {
            setError(err.message || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        try {
            await signInWithGoogle();
        } catch (err) {
            setError(err.message || "Google sign-in failed");
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={styles.header}>
                    <h2 style={styles.title}>
                        {mode === "login" ? "Welcome Back" : "Create Account"}
                    </h2>
                    <p style={styles.subtitle}>
                        {mode === "login"
                            ? "Sign in to sync your Blueprints across devices"
                            : "Start generating production-ready Blueprints"}
                    </p>
                    <button onClick={onClose} style={styles.closeBtn}>✕</button>
                </div>

                {/* Google OAuth */}
                <button onClick={handleGoogle} style={styles.googleBtn}>
                    <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                </button>

                {/* Divider */}
                <div style={styles.divider}>
                    <span style={styles.dividerLine} />
                    <span style={styles.dividerText}>or</span>
                    <span style={styles.dividerLine} />
                </div>

                {/* Email Form */}
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div>
                        <label style={styles.label}>Email</label>
                        <input
                            type="email" required
                            value={email} onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            style={styles.input}
                        />
                    </div>
                    <div>
                        <label style={styles.label}>Password</label>
                        <input
                            type="password" required minLength={6}
                            value={password} onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            style={styles.input}
                        />
                    </div>

                    {error && <div style={styles.error}>⚠️ {error}</div>}
                    {success && <div style={styles.success}>✅ {success}</div>}

                    <button type="submit" disabled={loading} style={styles.submitBtn}>
                        {loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}
                    </button>
                </form>

                {/* Toggle */}
                <div style={styles.toggle}>
                    {mode === "login" ? (
                        <span>Don't have an account? <button onClick={() => { setMode("signup"); setError(null); }} style={styles.toggleBtn}>Sign Up</button></span>
                    ) : (
                        <span>Already have an account? <button onClick={() => { setMode("login"); setError(null); }} style={styles.toggleBtn}>Sign In</button></span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── STYLES ───
const styles = {
    overlay: {
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
    },
    modal: {
        background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16,
        padding: "32px 28px", width: "100%", maxWidth: 400,
        boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
    },
    header: { textAlign: "center", position: "relative", marginBottom: 24 },
    title: { fontSize: 22, fontWeight: 800, color: "#fb923c", margin: 0 },
    subtitle: { fontSize: 13, color: "#64748b", marginTop: 6 },
    closeBtn: {
        position: "absolute", top: -8, right: -8,
        background: "none", border: "none", color: "#475569",
        fontSize: 18, cursor: "pointer", padding: 4,
    },
    googleBtn: {
        width: "100%", padding: "12px 16px", borderRadius: 10,
        background: "#1e293b", border: "1px solid #334155",
        color: "#e2e8f0", fontSize: 14, fontWeight: 600,
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s",
    },
    divider: {
        display: "flex", alignItems: "center", gap: 12, margin: "20px 0",
    },
    dividerLine: { flex: 1, height: 1, background: "#1e293b" },
    dividerText: { fontSize: 12, color: "#475569" },
    form: { display: "flex", flexDirection: "column", gap: 16 },
    label: {
        display: "block", fontSize: 12, fontWeight: 600,
        color: "#94a3b8", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5,
    },
    input: {
        width: "100%", padding: "10px 14px", borderRadius: 8,
        background: "#0a0f1a", border: "1px solid #1e293b",
        color: "#e2e8f0", fontSize: 14, outline: "none",
        boxSizing: "border-box",
    },
    error: {
        padding: "10px 12px", background: "#451a1a", border: "1px solid #7f1d1d",
        borderRadius: 8, fontSize: 13, color: "#fca5a5",
    },
    success: {
        padding: "10px 12px", background: "#052e16", border: "1px solid #14532d",
        borderRadius: 8, fontSize: 13, color: "#86efac",
    },
    submitBtn: {
        width: "100%", padding: "12px 16px", borderRadius: 10,
        background: "linear-gradient(135deg, #fb923c, #f97316)",
        border: "none", color: "#0a0f1a", fontSize: 14, fontWeight: 700,
        cursor: "pointer", transition: "all 0.2s",
    },
    toggle: { textAlign: "center", marginTop: 20, fontSize: 13, color: "#64748b" },
    toggleBtn: {
        background: "none", border: "none", color: "#fb923c",
        cursor: "pointer", fontWeight: 600, fontSize: 13, textDecoration: "underline",
    },
};
