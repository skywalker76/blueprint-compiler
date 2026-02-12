export function SectionTitle({ icon, title, subtitle }) {
    return (
        <div style={{ marginBottom: 18 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 10, color: "#f1f5f9" }}>
                <span style={{ fontSize: 22 }}>{icon}</span>{title}
            </h2>
            {subtitle && <p style={{ fontSize: 13, color: "#64748b", margin: "6px 0 0 34px" }}>{subtitle}</p>}
        </div>
    );
}
