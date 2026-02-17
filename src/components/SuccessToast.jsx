import { useState, useEffect } from "react";

// ─── SUCCESS TOAST ───
// Animated toast notification after Blueprint generation completes.
// Auto-dismisses after 4 seconds with slide-in/out animation.

export function SuccessToast({ fileCount, totalLines, qualityScore, onDismiss }) {
    const [visible, setVisible] = useState(false);
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        // Slight delay for mount animation
        const showTimer = setTimeout(() => setVisible(true), 50);
        // Auto-dismiss after 4s
        const hideTimer = setTimeout(() => {
            setExiting(true);
            setTimeout(() => onDismiss?.(), 400);
        }, 4000);
        return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
    }, [onDismiss]);

    return (
        <div
            onClick={() => { setExiting(true); setTimeout(() => onDismiss?.(), 400); }}
            style={{
                position: "fixed",
                top: 70,
                left: "50%",
                transform: `translateX(-50%) translateY(${visible && !exiting ? "0" : "-20px"})`,
                opacity: visible && !exiting ? 1 : 0,
                zIndex: 1000,
                background: "linear-gradient(135deg, #065f46 0%, #064e3b 100%)",
                border: "1px solid #10b981",
                borderRadius: 14,
                padding: "14px 28px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                boxShadow: "0 8px 32px rgba(16, 185, 129, 0.25), 0 0 60px rgba(16, 185, 129, 0.1)",
                cursor: "pointer",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                maxWidth: 500,
            }}
        >
            <span style={{ fontSize: 28, animation: "pulse 1s ease-in-out" }}>✅</span>
            <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#ecfdf5", letterSpacing: -0.3 }}>
                    Blueprint Ready!
                </div>
                <div style={{ fontSize: 12, color: "#6ee7b7", marginTop: 2, display: "flex", gap: 12 }}>
                    <span>📄 {fileCount}/5 files</span>
                    <span>📏 {totalLines.toLocaleString()} lines</span>
                    {qualityScore && <span>⭐ {qualityScore}/100</span>}
                </div>
            </div>
        </div>
    );
}
