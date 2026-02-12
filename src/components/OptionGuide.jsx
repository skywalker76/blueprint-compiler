export function OptionGuide({ guide, visible }) {
    if (!visible || !guide) return null;
    return (
        <div style={{ marginTop: 8, marginBottom: 4, padding: "10px 14px", background: "#1e293b88", borderRadius: 8, fontSize: 13, color: "#94a3b8", lineHeight: 1.6, borderLeft: "3px solid #c2410c" }}>
            {guide}
        </div>
    );
}
