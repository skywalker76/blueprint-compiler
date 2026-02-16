// ─── UPGRADE MODAL ───
// Shown when a Free user hits a Pro-only feature or generation limit
import { useNavigate } from "react-router-dom";

const REASONS = {
    generation_limit: {
        icon: "🚫",
        title: "Monthly Limit Reached",
        message: (data) => `You've used ${data.count}/${data.max} free generations this month. Upgrade to Pro for unlimited access.`,
    },
    ide_locked: {
        icon: "🔒",
        title: "IDE Target Locked",
        message: () => "Free tier supports Antigravity only. Upgrade to Pro to generate Blueprints for Cursor, Copilot, and Windsurf.",
    },
    scanner_locked: {
        icon: "🔍",
        title: "Project Scanner — Pro Feature",
        message: () => "Auto-detect your stack from package.json. Available with Pro.",
    },
    zip_locked: {
        icon: "📦",
        title: "Export ZIP — Pro Feature",
        message: () => "Download IDE-ready ZIP bundles with correct file paths. Available with Pro.",
    },
    refinement_locked: {
        icon: "🤖",
        title: "Quality Refinement — Pro Feature",
        message: () => "The agentic refinement loop (Generate→Validate→Refine) is a Pro feature. Free tier uses single-pass generation.",
    },
};

const PRO_FEATURES = [
    "✅ Unlimited generations",
    "✅ All 4 IDE targets",
    "✅ Agentic refinement loop",
    "✅ Project Scanner",
    "✅ Export ZIP / JSON",
    "✅ Cloud persistence",
    "✅ Priority support",
];

export function UpgradeModal({ reason, data = {}, onClose }) {
    const navigate = useNavigate();
    const info = REASONS[reason] || REASONS.generation_limit;

    const handleUpgrade = () => {
        onClose();
        navigate("/#pricing");
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Icon */}
                <div style={styles.iconWrap}>{info.icon}</div>

                {/* Title */}
                <h2 style={styles.title}>{info.title}</h2>
                <p style={styles.message}>{info.message(data)}</p>

                {/* Pro Features */}
                <div style={styles.featureBox}>
                    <div style={styles.featureHeader}>
                        <span style={styles.proBadge}>PRO</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>$19/month</span>
                    </div>
                    {PRO_FEATURES.map((f, i) => (
                        <div key={i} style={styles.featureItem}>{f}</div>
                    ))}
                </div>

                {/* CTA */}
                <button onClick={handleUpgrade} style={styles.upgradeBtn}>
                    ⚡ Upgrade to Pro
                </button>
                <button onClick={onClose} style={styles.dismissBtn}>
                    Maybe later
                </button>
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
        padding: "32px 28px", width: "100%", maxWidth: 420,
        boxShadow: "0 24px 48px rgba(0,0,0,0.5)", textAlign: "center",
    },
    iconWrap: { fontSize: 48, marginBottom: 12 },
    title: { fontSize: 22, fontWeight: 800, color: "#fb923c", margin: "0 0 8px" },
    message: { fontSize: 14, color: "#94a3b8", lineHeight: 1.5, margin: "0 0 24px" },
    featureBox: {
        background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 12,
        padding: 16, marginBottom: 20, textAlign: "left",
    },
    featureHeader: {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid #1e293b",
    },
    proBadge: {
        background: "linear-gradient(135deg, #f59e0b, #fb923c)", color: "#0a0f1a",
        padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 800,
        textTransform: "uppercase", letterSpacing: 1,
    },
    featureItem: { fontSize: 13, color: "#cbd5e1", padding: "4px 0" },
    upgradeBtn: {
        width: "100%", padding: "14px 16px", borderRadius: 10,
        background: "linear-gradient(135deg, #f59e0b, #fb923c)",
        border: "none", color: "#0a0f1a", fontSize: 15, fontWeight: 800,
        cursor: "pointer", transition: "all 0.2s", marginBottom: 10,
    },
    dismissBtn: {
        width: "100%", padding: "10px 16px", borderRadius: 10,
        background: "transparent", border: "1px solid #334155",
        color: "#64748b", fontSize: 13, fontWeight: 500,
        cursor: "pointer", transition: "all 0.2s",
    },
};
