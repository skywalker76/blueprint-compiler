import { useState, Component } from "react";
import { CopyButton } from "./CopyButton.jsx";
import { exportAsJson, exportAsYaml, exportAsZip, getBlueprintJsonString } from "../engine/persistence.js";

// ─── ERROR BOUNDARY ───
// Catches rendering errors and shows fallback instead of blank page
class TabsErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, info) {
        console.error("[BlueprintTabs] Render error:", error, info);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 20 }}>
                    <div style={{ color: "#fca5a5", fontSize: 13, marginBottom: 8 }}>
                        ⚠️ Tab view encountered an error. Showing raw files instead.
                    </div>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, color: "#fb923c", padding: "6px 12px", cursor: "pointer", fontSize: 12 }}
                    >
                        ↻ Retry Tab View
                    </button>
                    <div style={{ marginTop: 12 }}>{this.props.children}</div>
                </div>
            );
        }
        return this.props.render();
    }
}

// ─── TAB DEFINITIONS ───
const TABS = [
    { id: "overview", icon: "📋", label: "Overview" },
    { id: "architecture", icon: "🏗️", label: "Architecture" },
    { id: "tools", icon: "🛠️", label: "Tools & Skills" },
    { id: "prompts", icon: "💬", label: "Prompts" },
    { id: "raw", icon: "📁", label: "Raw Files" },
];

// ─── SECTION PARSER ───
function parseSections(text) {
    if (!text || typeof text !== "string") return [];
    const lines = text.split("\n");
    const sections = [];
    let current = null;

    for (const line of lines) {
        const h2 = line.match(/^## (.+)/);
        const h3 = line.match(/^### (.+)/);
        if (h2 || h3) {
            if (current) sections.push(current);
            current = { title: (h2 || h3)[1].trim(), level: h2 ? 2 : 3, content: "" };
        } else if (current) {
            current.content += line + "\n";
        } else {
            if (!sections.length && line.trim()) {
                current = { title: "Introduction", level: 2, content: line + "\n" };
            }
        }
    }
    if (current) sections.push(current);
    return sections;
}

// ─── FILTER SECTIONS ───
function filterSections(allSections, keywords) {
    if (!keywords || keywords.length === 0) return allSections;
    return allSections.filter(s => {
        const lower = (s.title || "").toLowerCase();
        return keywords.some(kw => lower.includes(kw));
    });
}

// ─── SECTION CARD ───
function SectionCard({ title, content, level }) {
    const [expanded, setExpanded] = useState(true);
    const safeContent = content || "";
    const isLong = safeContent.length > 500;

    return (
        <div style={{
            background: "#0c1929",
            border: "1px solid #1e3a5f",
            borderRadius: 10,
            marginBottom: 10,
            overflow: "hidden",
        }}>
            <div
                onClick={() => isLong && setExpanded(!expanded)}
                style={{
                    padding: "10px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: isLong ? "pointer" : "default",
                    borderBottom: expanded ? "1px solid #1e3a5f22" : "none",
                }}
            >
                <div style={{
                    fontSize: level === 2 ? 14 : 13,
                    fontWeight: 700,
                    color: level === 2 ? "#7dd3fc" : "#94a3b8",
                }}>
                    {title || "Section"}
                </div>
                {isLong && (
                    <span style={{ fontSize: 11, color: "#475569" }}>
                        {expanded ? "▼" : "▶"}
                    </span>
                )}
            </div>
            {expanded && (
                <div style={{
                    padding: "10px 16px 14px",
                    fontSize: 12,
                    lineHeight: 1.7,
                    color: "#cbd5e1",
                    whiteSpace: "pre-wrap",
                    maxHeight: 400,
                    overflowY: "auto",
                    fontFamily: "JetBrains Mono, monospace",
                }}>
                    {safeContent.trim()}
                </div>
            )}
        </div>
    );
}

// ─── OVERVIEW TAB ───
function OverviewPanel({ config, generated, avgQuality, domain, currentIde }) {
    // Defensive: ensure generated is an object
    const safeGenerated = generated || {};
    const safeConfig = config || {};

    const fileCount = Object.values(safeGenerated).filter(r => r?.output).length;
    const totalLines = Object.values(safeGenerated)
        .filter(r => r?.output && typeof r.output === "string")
        .reduce((sum, r) => sum + r.output.split("\n").length, 0);
    const refinedCount = Object.values(safeGenerated).filter(r => r?.refined).length;
    const qScore = typeof avgQuality === "number" ? avgQuality : null;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Project Card */}
            <div style={{
                background: "linear-gradient(135deg, #0c1929 0%, #1c120888 100%)",
                border: "1px solid #1e3a5f",
                borderRadius: 12,
                padding: 20,
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600, letterSpacing: 1 }}>Blueprint</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "#fb923c", marginTop: 4 }}>{safeConfig.projectName || "Unnamed"}</div>
                        <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 6, lineHeight: 1.5, maxWidth: 500 }}>{safeConfig.mission || ""}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: 36 }}>{domain?.icon || "📦"}</span>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{domain?.name || ""}</div>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
                {[
                    { label: "Files Generated", value: `${fileCount}/5`, icon: "📄", color: "#7dd3fc" },
                    { label: "Total Lines", value: totalLines.toLocaleString(), icon: "📏", color: "#a78bfa" },
                    { label: "Quality Score", value: qScore !== null ? `${qScore}/100` : "—", icon: "⭐", color: qScore !== null && qScore >= 80 ? "#6ee7b7" : "#fbbf24" },
                    { label: "Auto-Refined", value: String(refinedCount), icon: "♻️", color: "#f472b6" },
                ].map((m, i) => (
                    <div key={i} style={{
                        background: "#0f172a",
                        border: "1px solid #1e293b",
                        borderRadius: 10,
                        padding: "14px 16px",
                        textAlign: "center",
                    }}>
                        <div style={{ fontSize: 22, marginBottom: 4 }}>{m.icon}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: m.color }}>{m.value}</div>
                        <div style={{ fontSize: 10, color: "#475569", marginTop: 2, textTransform: "uppercase", fontWeight: 600 }}>{m.label}</div>
                    </div>
                ))}
            </div>

            {/* Config Summary */}
            <div style={{
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: 10,
                padding: 16,
            }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#7dd3fc", marginBottom: 10 }}>⚙️ Configuration</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div style={metaRow}><span style={metaLabel}>IDE Target</span><span style={metaValue}>{currentIde?.icon || ""} {currentIde?.name || "—"}</span></div>
                    <div style={metaRow}><span style={metaLabel}>Rigor</span><span style={metaValue}>{safeConfig.rigor || "—"}</span></div>
                    <div style={metaRow}><span style={metaLabel}>Priorities</span><span style={metaValue}>{Array.isArray(safeConfig.priorities) ? safeConfig.priorities.join(" > ") : "—"}</span></div>
                    <div style={metaRow}><span style={metaLabel}>Domain</span><span style={metaValue}>{domain?.name || "—"}</span></div>
                </div>
                {safeConfig.stack && Object.keys(safeConfig.stack).length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                        {Object.entries(safeConfig.stack).map(([k, v]) => (
                            <span key={k} style={{
                                padding: "3px 10px",
                                background: "#1e293b",
                                borderRadius: 20,
                                fontSize: 11,
                                color: "#e2e8f0",
                            }}>
                                {k}: <strong>{String(v)}</strong>
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const metaRow = { display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #1e293b22" };
const metaLabel = { fontSize: 11, color: "#64748b" };
const metaValue = { fontSize: 12, color: "#e2e8f0", fontWeight: 600 };

// ─── PARSED CONTENT TAB ───
function ParsedPanel({ generated, fileIds, keywords, emptyMsg }) {
    const safeGenerated = generated || {};
    const allSections = [];

    for (const fid of (fileIds || [])) {
        const output = safeGenerated[fid]?.output;
        if (output && typeof output === "string") {
            const sections = parseSections(output);
            if (keywords && keywords.length > 0) {
                allSections.push(...filterSections(sections, keywords));
            } else {
                allSections.push(...sections);
            }
        }
    }

    if (allSections.length === 0) {
        return (
            <div style={{ textAlign: "center", padding: 40, color: "#334155" }}>
                {emptyMsg || "No content generated yet. Click \"⚡ Generate All\" above."}
            </div>
        );
    }

    const allText = allSections.map(s => `## ${s.title}\n${s.content}`).join("\n");

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                <CopyButton text={allText} />
            </div>
            {allSections.map((s, i) => (
                <SectionCard key={i} title={s.title} content={s.content} level={s.level} />
            ))}
        </div>
    );
}

// ─── MAIN COMPONENT ───
// ─── EXPORT BAR ───
function ExportBar({ blueprint }) {
    const [feedback, setFeedback] = useState(null);

    const showFeedback = (key) => {
        setFeedback(key);
        setTimeout(() => setFeedback(null), 2000);
    };

    const handleCopyJson = async () => {
        try {
            const json = getBlueprintJsonString(blueprint);
            await navigator.clipboard.writeText(json);
            showFeedback("json");
        } catch {
            exportAsJson(blueprint);
            showFeedback("json");
        }
    };

    const handleYaml = () => {
        exportAsYaml(blueprint);
        showFeedback("yaml");
    };

    const handleZip = async () => {
        await exportAsZip(blueprint);
        showFeedback("zip");
    };

    const handleCopySystemPrompt = async () => {
        const gen = blueprint?.generated || {};
        const config = blueprint?.config || {};
        const fileOrder = ["prompt", "rules", "skills", "workflows", "context"];
        const fileLabels = {
            prompt: "PROMPT_START",
            rules: "WORKSPACE RULES",
            skills: "SKILLS & COMPETENCIES",
            workflows: "WORKFLOWS",
            context: "CONTEXT & ADRs",
        };

        let prompt = `# ${config.projectName || "Project"} — AI Agent Blueprint\n`;
        prompt += `# Generated by Blueprint Compiler v2.1\n`;
        prompt += `# Domain: ${config.domain || "custom"} | Rigor: ${config.rigor || "balanced"}\n`;
        prompt += `${"─".repeat(60)}\n\n`;

        for (const fid of fileOrder) {
            const output = gen[fid]?.output;
            if (output && typeof output === "string") {
                prompt += `${"═".repeat(60)}\n`;
                prompt += `# ${fileLabels[fid] || fid.toUpperCase()}\n`;
                prompt += `${"═".repeat(60)}\n\n`;
                prompt += output.trim() + "\n\n";
            }
        }

        try {
            await navigator.clipboard.writeText(prompt);
            showFeedback("sysprompt");
        } catch {
            // Fallback: download as .txt
            const blob = new Blob([prompt], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${config.projectName || "blueprint"}-system-prompt.txt`;
            a.click();
            URL.revokeObjectURL(url);
            showFeedback("sysprompt");
        }
    };

    const btnBase = {
        padding: "7px 14px",
        borderRadius: 8,
        border: "1px solid #1e3a5f",
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 6,
        transition: "all 0.25s",
    };

    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            background: "#060b14",
            borderLeft: "1px solid #1e293b",
            borderRight: "1px solid #1e293b",
            flexWrap: "wrap",
        }}>
            <span style={{ fontSize: 11, color: "#475569", fontWeight: 600, marginRight: 4 }}>EXPORT</span>
            <button
                onClick={handleCopySystemPrompt}
                style={{
                    ...btnBase,
                    background: feedback === "sysprompt" ? "#064e3b" : "linear-gradient(135deg, #1c1208 0%, #0f172a 100%)",
                    color: feedback === "sysprompt" ? "#6ee7b7" : "#fbbf24",
                    border: "1px solid #92400e",
                }}
            >
                {feedback === "sysprompt" ? "✓ Copied!" : "📋 Copy System Prompt"}
            </button>
            <button
                onClick={handleCopyJson}
                style={{
                    ...btnBase,
                    background: feedback === "json" ? "#064e3b" : "#0f172a",
                    color: feedback === "json" ? "#6ee7b7" : "#7dd3fc",
                }}
            >
                {feedback === "json" ? "✓ Copied!" : "📋 Copy JSON"}
            </button>
            <button
                onClick={handleYaml}
                style={{
                    ...btnBase,
                    background: feedback === "yaml" ? "#064e3b" : "#0f172a",
                    color: feedback === "yaml" ? "#6ee7b7" : "#a78bfa",
                }}
            >
                {feedback === "yaml" ? "✓ Downloaded!" : "📥 YAML"}
            </button>
            <button
                onClick={handleZip}
                style={{
                    ...btnBase,
                    background: feedback === "zip" ? "#064e3b" : "#0f172a",
                    color: feedback === "zip" ? "#6ee7b7" : "#fb923c",
                }}
            >
                {feedback === "zip" ? "✓ Downloaded!" : "📦 ZIP"}
            </button>
        </div>
    );
}

export function BlueprintTabs({ generated, config, ideTarget, avgQuality, domain, currentIde, FILE_TYPES, children, readOnly = false }) {
    const [viewTab, setViewTab] = useState("overview");
    const safeGenerated = generated || {};
    const hasOutput = Object.values(safeGenerated).some(r => r?.output);

    // Don't show tabs if nothing generated — just pass through children
    if (!hasOutput) return <>{children}</>;

    // Assemble the full blueprint object for export functions
    const blueprint = {
        config: config || {},
        generated: safeGenerated,
        ideTarget: ideTarget || "antigravity",
    };

    const renderTabs = () => (
        <div>
            {/* ─── Tab Bar ─── */}
            <div style={{
                display: "flex",
                gap: 2,
                background: "#080d17",
                borderRadius: "12px 12px 0 0",
                padding: "6px 6px 0",
                border: "1px solid #1e293b",
                borderBottom: "none",
                overflowX: "auto",
            }}>
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setViewTab(tab.id)}
                        style={{
                            padding: "10px 18px",
                            borderRadius: "10px 10px 0 0",
                            border: "none",
                            borderBottom: viewTab === tab.id ? "2px solid #fb923c" : "2px solid transparent",
                            background: viewTab === tab.id
                                ? "linear-gradient(180deg, #1c1208 0%, #111827 100%)"
                                : "transparent",
                            color: viewTab === tab.id ? "#fb923c" : "#64748b",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            transition: "all 0.2s",
                            whiteSpace: "nowrap",
                            flex: "0 0 auto",
                        }}
                    >
                        <span style={{ fontSize: 15 }}>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ─── Export Bar ─── */}
            {!readOnly && <ExportBar blueprint={blueprint} />}

            {/* ─── Tab Content ─── */}
            <div style={{
                background: "#0a0f1a",
                border: "1px solid #1e293b",
                borderTop: "none",
                borderRadius: "0 0 12px 12px",
                padding: 20,
                minHeight: 200,
            }}>
                {viewTab === "overview" && (
                    <OverviewPanel
                        config={config}
                        ideTarget={ideTarget}
                        generated={safeGenerated}
                        avgQuality={avgQuality}
                        domain={domain}
                        currentIde={currentIde}
                    />
                )}

                {viewTab === "architecture" && (
                    <ParsedPanel
                        generated={safeGenerated}
                        fileIds={["rules", "context"]}
                        keywords={["architect", "stack", "security", "convention", "decision", "pattern", "database", "api", "auth", "deploy", "infra", "core", "testing", "performance"]}
                        emptyMsg="Generate the Rules and Context files to see architecture details."
                    />
                )}

                {viewTab === "tools" && (
                    <ParsedPanel
                        generated={safeGenerated}
                        fileIds={["skills", "workflows"]}
                        keywords={[]}
                        emptyMsg="Generate Skills and Workflows to see tools and competencies."
                    />
                )}

                {viewTab === "prompts" && (
                    <ParsedPanel
                        generated={safeGenerated}
                        fileIds={["prompt", "rules"]}
                        keywords={["identity", "role", "persona", "prompt", "system", "instruction", "overview", "project", "entry", "mission", "thinking", "protocol"]}
                        emptyMsg="Generate PROMPT_START and Rules to see prompt definitions."
                    />
                )}

                {viewTab === "raw" && children}
            </div>
        </div>
    );

    return (
        <TabsErrorBoundary render={renderTabs}>
            {children}
        </TabsErrorBoundary>
    );
}
