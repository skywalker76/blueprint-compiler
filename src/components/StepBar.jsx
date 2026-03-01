export function StepBar({ steps, current, onStepClick }) {
    return (
        <div style={{ display: "flex", gap: 0, marginBottom: 32, padding: "0 10px" }}>
            {steps.map((s, i) => {
                const isClickable = i < current && onStepClick;
                return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                        <div
                            onClick={() => isClickable && onStepClick(i)}
                            style={{
                                width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                                background: i < current ? "#065f46" : i === current ? "#c2410c" : "#1e293b",
                                color: i <= current ? "#fff" : "#475569", fontWeight: 700, fontSize: 14,
                                border: i === current ? "2px solid #fb923c" : "2px solid transparent",
                                transition: "all .3s ease",
                                boxShadow: i === current ? "0 0 12px #c2410c44" : "none",
                                cursor: isClickable ? "pointer" : "default",
                            }}
                            title={isClickable ? `Go back to ${s}` : ""}
                        >
                            {i < current ? "✓" : i + 1}
                        </div>
                        <span
                            onClick={() => isClickable && onStepClick(i)}
                            style={{
                                fontSize: 10, color: i <= current ? "#e2e8f0" : "#475569", marginTop: 5,
                                textAlign: "center", fontWeight: i === current ? 600 : 400,
                                cursor: isClickable ? "pointer" : "default",
                            }}
                        >{s}</span>
                        {i < steps.length - 1 && (
                            <div style={{ position: "absolute", top: 16, left: "calc(50% + 20px)", right: "calc(-50% + 20px)", height: 2, background: i < current ? "#065f46" : "#1e293b", transition: "background .3s ease" }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
