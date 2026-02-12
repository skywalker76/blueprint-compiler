// ─── SHARED STYLES ───
export const S = {
    card: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: "28px 24px", marginBottom: 20 },
    btn: (primary, disabled) => ({
        padding: "10px 22px", border: "none", borderRadius: 8, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        background: disabled ? "#1e293b" : primary ? "#c2410c" : "#1e293b",
        color: disabled ? "#475569" : "#e2e8f0", fontSize: 14, transition: "all .2s",
    }),
    input: { width: "100%", padding: "10px 14px", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" },
    label: { fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, display: "block" },
    nav: { display: "flex", justifyContent: "space-between", marginTop: 20 },
    textarea: { width: "100%", padding: "10px 14px", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#e2e8f0", fontSize: 14, outline: "none", fontFamily: "JetBrains Mono, monospace", minHeight: 120, resize: "vertical", boxSizing: "border-box" },
    badge: (active) => ({
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
        background: active ? "#c2410c22" : "#1e293b",
        color: active ? "#fb923c" : "#64748b",
        border: `1px solid ${active ? "#c2410c44" : "#1e293b"}`,
    }),
    tag: { display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: "#065f4622", color: "#34d399", border: "1px solid #065f4644" },
};
