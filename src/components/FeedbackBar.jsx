// ─── FEEDBACK BAR ───
// Post-generation feedback: 👍/👎 + optional comment → Supabase
import { useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

const S = {
    bar: {
        display: "flex", alignItems: "center", gap: 12, padding: "14px 20px",
        background: "linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))",
        borderRadius: 12, border: "1px solid rgba(148,163,184,0.1)",
        marginTop: 16, backdropFilter: "blur(8px)",
    },
    label: { color: "#94a3b8", fontSize: 13, fontWeight: 500 },
    btn: (active, color) => ({
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "8px 16px", borderRadius: 8, cursor: "pointer",
        fontSize: 14, fontWeight: 600, transition: "all 0.2s ease",
        border: active ? "none" : "1px solid rgba(148,163,184,0.2)",
        background: active
            ? color === "green" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"
            : "rgba(30,41,59,0.5)",
        color: active
            ? color === "green" ? "#4ade80" : "#f87171"
            : "#94a3b8",
        transform: active ? "scale(1.05)" : "scale(1)",
        boxShadow: active ? `0 0 12px ${color === "green" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}` : "none",
    }),
    commentWrap: {
        display: "flex", gap: 8, marginTop: 12, width: "100%",
    },
    input: {
        flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 13,
        background: "rgba(15,23,42,0.8)", border: "1px solid rgba(148,163,184,0.15)",
        color: "#e2e8f0", outline: "none", fontFamily: "inherit",
    },
    sendBtn: {
        padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
        background: "linear-gradient(135deg, #fb923c, #f97316)",
        color: "#0f172a", border: "none", cursor: "pointer",
        transition: "all 0.2s", whiteSpace: "nowrap",
    },
    sentMsg: {
        color: "#4ade80", fontSize: 13, fontWeight: 500, display: "flex",
        alignItems: "center", gap: 6,
    },
};

export function FeedbackBar({ blueprintId, config, userId }) {
    const [rating, setRating] = useState(null);     // 'up' | 'down' | null
    const [comment, setComment] = useState("");
    const [sent, setSent] = useState(false);
    const [sending, setSending] = useState(false);

    async function submitFeedback(r, c = "") {
        const payload = {
            blueprint_id: blueprintId || "unknown",
            rating: r,
            comment: c || null,
            config: config ? { domain: config.domain, ideTarget: config.ideTarget, projectName: config.projectName } : {},
            user_id: userId || null,
        };

        // Try Supabase, fallback to localStorage
        if (isSupabaseConfigured() && supabase) {
            try {
                await supabase.from("feedback").insert(payload);
            } catch (err) {
                console.warn("[Feedback] Supabase insert failed, saving locally:", err.message);
                saveLocally(payload);
            }
        } else {
            saveLocally(payload);
        }
    }

    function saveLocally(payload) {
        try {
            const existing = JSON.parse(localStorage.getItem("blueprint-feedback") || "[]");
            existing.push({ ...payload, created_at: new Date().toISOString() });
            localStorage.setItem("blueprint-feedback", JSON.stringify(existing));
        } catch { /* ignore */ }
    }

    async function handleRate(r) {
        setRating(r);
        if (r === "up") {
            // Thumbs up → send immediately, no comment needed
            setSending(true);
            await submitFeedback(r);
            setSending(false);
            setSent(true);
        }
        // Thumbs down → show comment box (submitted on send or auto after 5s)
    }

    async function handleSendComment() {
        setSending(true);
        await submitFeedback(rating, comment);
        setSending(false);
        setSent(true);
    }

    if (sent) {
        return (
            <div style={S.bar}>
                <span style={S.sentMsg}>
                    ✅ Thanks for your feedback!
                </span>
            </div>
        );
    }

    return (
        <div style={{ ...S.bar, flexWrap: "wrap" }}>
            <span style={S.label}>How was this blueprint?</span>

            <button
                style={S.btn(rating === "up", "green")}
                onClick={() => handleRate("up")}
                disabled={sending}
                title="Good result"
            >
                👍 Helpful
            </button>

            <button
                style={S.btn(rating === "down", "red")}
                onClick={() => handleRate("down")}
                disabled={sending}
                title="Needs improvement"
            >
                👎 Could improve
            </button>

            {rating === "down" && !sent && (
                <div style={S.commentWrap}>
                    <input
                        style={S.input}
                        placeholder="What would make it better? (optional)"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
                    />
                    <button
                        style={{ ...S.sendBtn, opacity: sending ? 0.6 : 1 }}
                        onClick={handleSendComment}
                        disabled={sending}
                    >
                        {sending ? "Sending..." : "Send →"}
                    </button>
                </div>
            )}
        </div>
    );
}
