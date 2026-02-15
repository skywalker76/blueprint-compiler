import { useState, useMemo } from "react";
import { PRESET_CATEGORIES } from "../data/presets";

// ─── QUICK START BAR ───
// Renders preset cards with category filter pills.
// Click a card → populates wizard → jumps to Generate step.

export function QuickStartBar({ presets, onSelect }) {
    const [hovered, setHovered] = useState(null);
    const [activeCategory, setActiveCategory] = useState("all");

    const filtered = useMemo(
        () => activeCategory === "all" ? presets : presets.filter(p => p.category === activeCategory),
        [presets, activeCategory]
    );

    return (
        <div style={{ margin: "0 0 20px", padding: "20px 0" }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{
                    fontSize: 15, fontWeight: 700, color: "#e2e8f0",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                    <span style={{ fontSize: 18 }}>⚡</span>
                    Quick Start
                    <span style={{
                        fontSize: 10, fontWeight: 600, background: "rgba(251,146,60,0.15)",
                        color: "#fb923c", padding: "2px 8px", borderRadius: 10,
                        border: "1px solid rgba(251,146,60,0.2)",
                    }}>
                        {presets.length} templates
                    </span>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    Pick a template, skip the wizard, generate instantly
                </div>
            </div>

            {/* Category Filter Pills */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 6, flexWrap: "wrap", marginBottom: 16, padding: "0 10px",
            }}>
                {PRESET_CATEGORIES.map(cat => {
                    const isActive = activeCategory === cat.id;
                    const count = cat.id === "all" ? presets.length : presets.filter(p => p.category === cat.id).length;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            style={{
                                display: "inline-flex", alignItems: "center", gap: 5,
                                padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                                cursor: "pointer", transition: "all 0.2s ease",
                                border: isActive ? "1px solid rgba(251,146,60,0.4)" : "1px solid rgba(148,163,184,0.15)",
                                background: isActive
                                    ? "rgba(251,146,60,0.12)"
                                    : "rgba(15,23,42,0.6)",
                                color: isActive ? "#fb923c" : "#64748b",
                                transform: isActive ? "scale(1.05)" : "scale(1)",
                            }}
                        >
                            <span style={{ fontSize: 13 }}>{cat.icon}</span>
                            {cat.label}
                            <span style={{
                                fontSize: 9, background: isActive ? "rgba(251,146,60,0.2)" : "rgba(100,116,139,0.2)",
                                padding: "1px 5px", borderRadius: 8,
                                color: isActive ? "#fb923c" : "#475569",
                            }}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Cards Grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))",
                gap: 10,
                maxHeight: 440,
                overflowY: "auto",
                padding: "2px 2px 2px 0",
            }}>
                {filtered.map((preset) => {
                    const isHovered = hovered === preset.id;
                    return (
                        <div
                            key={preset.id}
                            onClick={() => onSelect(preset)}
                            onMouseEnter={() => setHovered(preset.id)}
                            onMouseLeave={() => setHovered(null)}
                            style={{
                                position: "relative", padding: 14, borderRadius: 12,
                                cursor: "pointer", transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                background: isHovered ? "rgba(30, 41, 59, 0.9)" : "rgba(15, 23, 42, 0.7)",
                                border: "1px solid", borderColor: isHovered ? "#334155" : "#1e293b",
                                borderTop: "2px solid transparent",
                                borderImage: isHovered ? `${preset.gradient} 1` : "none",
                                borderImageSlice: isHovered ? 1 : undefined,
                                transform: isHovered ? "translateY(-3px) scale(1.02)" : "translateY(0) scale(1)",
                                boxShadow: isHovered ? "0 8px 25px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.1)",
                            }}
                        >
                            {/* Gradient top accent */}
                            <div style={{
                                position: "absolute", top: -1, left: 10, right: 10, height: 2,
                                background: preset.gradient, borderRadius: "0 0 2px 2px",
                                opacity: isHovered ? 1 : 0.5, transition: "opacity 0.25s",
                            }} />

                            {/* Icon + Title */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <span style={{ fontSize: 22 }}>{preset.icon}</span>
                                <div>
                                    <div style={{
                                        fontSize: 13, fontWeight: 700,
                                        color: isHovered ? "#f8fafc" : "#cbd5e1",
                                        transition: "color 0.2s",
                                    }}>
                                        {preset.title}
                                    </div>
                                </div>
                            </div>

                            {/* Subtitle */}
                            <div style={{
                                fontSize: 11, color: "#64748b", lineHeight: 1.4,
                                marginBottom: 10, minHeight: 30,
                            }}>
                                {preset.subtitle}
                            </div>

                            {/* Stack Pills */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {preset.stackPills.map((pill) => (
                                    <span key={pill} style={{
                                        fontSize: 9, fontWeight: 600, color: "#94a3b8",
                                        background: "rgba(30, 41, 59, 0.8)", border: "1px solid #334155",
                                        borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap",
                                    }}>
                                        {pill}
                                    </span>
                                ))}
                            </div>

                            {/* IDE badge */}
                            <div style={{ position: "absolute", top: 8, right: 8, fontSize: 12, opacity: 0.6 }}>
                                {preset.ideTarget === "antigravity" ? "🔮" :
                                    preset.ideTarget === "cursor" ? "⚡" :
                                        preset.ideTarget === "copilot" ? "🐙" : "🏄"}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Manual config link */}
            <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "#475569" }}>
                or configure manually below ↓
            </div>
        </div>
    );
}
