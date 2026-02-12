// ─── QUALITY SCORE COMPONENT ───
// Circular animated score display with category breakdown

import { getGradeLabel } from "../engine/validator.js";

const CATEGORY_LABELS = {
    completeness: { icon: "📋", label: "Completeness" },
    specificity: { icon: "🎯", label: "Specificity" },
    coherence: { icon: "🔗", label: "Coherence" },
    length: { icon: "📏", label: "Length" },
};

const GRADE_COLORS = {
    A: "#34d399",
    B: "#60a5fa",
    C: "#fbbf24",
    D: "#f97316",
    F: "#ef4444",
};

export function QualityScore({ quality, compact = false }) {
    if (!quality) return null;

    const { score, grade, breakdown, issues } = quality;
    const color = GRADE_COLORS[grade] || "#64748b";
    const circumference = 2 * Math.PI * 42;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    if (compact) {
        return (
            <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                background: `${color}18`, color, border: `1px solid ${color}33`,
            }}>
                {grade} · {score}
            </span>
        );
    }

    return (
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                {/* Circular score */}
                <div style={{ position: "relative", width: 100, height: 100, flexShrink: 0 }}>
                    <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="6" />
                        <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            style={{ transition: "stroke-dashoffset 1s ease" }}
                        />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 28, fontWeight: 800, color }}>{score}</span>
                        <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{grade}</span>
                    </div>
                </div>

                {/* Breakdown */}
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 8 }}>
                        {getGradeLabel(grade)}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
                        {breakdown && Object.entries(breakdown).map(([key, value]) => {
                            const cat = CATEGORY_LABELS[key];
                            const barColor = value >= 80 ? "#34d399" : value >= 60 ? "#fbbf24" : "#ef4444";
                            return (
                                <div key={key} style={{ fontSize: 11 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8", marginBottom: 2 }}>
                                        <span>{cat?.icon} {cat?.label || key}</span>
                                        <span style={{ fontWeight: 600, color: barColor }}>{value}</span>
                                    </div>
                                    <div style={{ height: 3, background: "#1e293b", borderRadius: 2, overflow: "hidden" }}>
                                        <div style={{ height: "100%", width: `${value}%`, background: barColor, borderRadius: 2, transition: "width 0.8s ease" }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Issues */}
            {issues && issues.length > 0 && (
                <div style={{ marginTop: 14, borderTop: "1px solid #1e293b", paddingTop: 10 }}>
                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 6 }}>Issues ({issues.length})</div>
                    {issues.slice(0, 5).map((issue, i) => (
                        <div key={i} style={{ fontSize: 11, color: issue.severity === "critical" ? "#ef4444" : issue.severity === "high" ? "#f97316" : "#fbbf24", padding: "3px 0", display: "flex", gap: 6 }}>
                            <span style={{ opacity: 0.6 }}>•</span>
                            <span>[{issue.category}] {issue.message}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
