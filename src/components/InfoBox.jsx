import { S } from "../styles.js";

export function InfoBox({ type = "info", children }) {
    const colors = {
        info: { bg: "#0c4a6e22", border: "#0c4a6e55", icon: "💡", text: "#7dd3fc" },
        warn: { bg: "#78350f22", border: "#78350f55", icon: "⚠️", text: "#fbbf24" },
        success: { bg: "#065f4622", border: "#065f4655", icon: "✅", text: "#34d399" },
        tip: { bg: "#3b0a6422", border: "#3b0a6455", icon: "💎", text: "#c084fc" },
    };
    const c = colors[type] || colors.info;
    return (
        <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "12px 16px", margin: "12px 0", fontSize: 13, lineHeight: 1.6, color: c.text }}>
            <span style={{ marginRight: 8 }}>{c.icon}</span>{children}
        </div>
    );
}
