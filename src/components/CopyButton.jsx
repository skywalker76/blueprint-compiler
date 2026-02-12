import { useState } from "react";

export function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);

    return (
        <button
            onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            style={{ padding: "6px 14px", background: copied ? "#065f46" : "#1e293b", border: "1px solid #334155", borderRadius: 6, color: "#e2e8f0", cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all .2s" }}
        >
            {copied ? "✓ Copied" : "📋 Copy"}
        </button>
    );
}
