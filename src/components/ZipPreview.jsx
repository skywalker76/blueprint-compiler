import { useState, useMemo, useEffect } from "react";
import { getZipFileTree, exportAsZip } from "../engine/persistence.js";

// ─── FILE TYPE ICONS ───
const FILE_ICONS = {
    rules: "📋",
    skill: "🧠",
    workflows: "⚙️",
    context: "📚",
    prompt: "🚀",
    readme: "📖",
    meta: "🔧",
};

// ─── FORMAT BYTES ───
function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
}

// ─── BUILD TREE FROM FLAT FILE LIST ───
function buildTree(files) {
    const root = { name: "/", children: {}, files: [] };

    for (const file of files) {
        const parts = file.path.split("/");
        let current = root;

        for (let i = 0; i < parts.length - 1; i++) {
            const dir = parts[i];
            if (!current.children[dir]) {
                current.children[dir] = { name: dir, children: {}, files: [] };
            }
            current = current.children[dir];
        }
        current.files.push({ ...file, filename: parts[parts.length - 1] });
    }

    return root;
}

// ─── TREE NODE ───
function TreeNode({ node, depth = 0 }) {
    const [expanded, setExpanded] = useState(true);
    const dirs = Object.values(node.children);
    const hasContent = dirs.length > 0 || node.files.length > 0;

    if (!hasContent) return null;

    const pad = depth * 20;

    return (
        <>
            {/* Directories */}
            {dirs.map(dir => (
                <div key={dir.name}>
                    <div
                        onClick={() => setExpanded(!expanded)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            paddingLeft: pad,
                            padding: `4px 8px 4px ${pad}px`,
                            cursor: "pointer",
                            fontSize: 13,
                            color: "#93c5fd",
                            fontWeight: 600,
                            borderRadius: 4,
                            transition: "background 0.15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#1e293b"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                        <span style={{ fontSize: 10, opacity: 0.6, width: 12, textAlign: "center" }}>
                            {expanded ? "▼" : "▶"}
                        </span>
                        <span>📁</span>
                        <span>{dir.name}/</span>
                    </div>
                    {expanded && <TreeNode node={dir} depth={depth + 1} />}
                </div>
            ))}

            {/* Files */}
            {node.files.map(file => (
                <div
                    key={file.path}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        paddingLeft: pad + 20,
                        padding: `4px 8px 4px ${pad + 20}px`,
                        fontSize: 12,
                        color: "#e2e8f0",
                        borderRadius: 4,
                        transition: "background 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#1e293b"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                    <span>{FILE_ICONS[file.type] || "📄"}</span>
                    <span style={{ flex: 1, fontFamily: "monospace", fontSize: 11 }}>{file.filename}</span>
                    <span style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace", minWidth: 55, textAlign: "right" }}>
                        {formatBytes(file.size)}
                    </span>
                    <span style={{ fontSize: 10, color: "#475569", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {file.description}
                    </span>
                </div>
            ))}
        </>
    );
}

// ─── MAIN COMPONENT ───
export function ZipPreview({ blueprint, onClose }) {
    const [downloading, setDownloading] = useState(false);
    const [files, setFiles] = useState([]);
    const [loadingTree, setLoadingTree] = useState(true);

    useEffect(() => {
        let mounted = true;
        setLoadingTree(true);
        getZipFileTree(blueprint).then(f => {
            if (mounted) {
                setFiles(f);
                setLoadingTree(false);
            }
        });
        return () => { mounted = false; };
    }, [blueprint]);

    const tree = useMemo(() => buildTree(files), [files]);
    const totalSize = useMemo(() => files.reduce((sum, f) => sum + f.size, 0), [files]);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            await exportAsZip(blueprint);
        } finally {
            setDownloading(false);
        }
    };

    const projectName = blueprint.config?.projectName || "blueprint";
    const ide = blueprint.ideTarget || "antigravity";

    return (
        <div style={{
            background: "linear-gradient(180deg, #0a0f1a 0%, #0d1117 100%)",
            border: "1px solid #1e3a5f",
            borderRadius: 12,
            padding: 0,
            marginTop: 8,
            overflow: "hidden",
            animation: "fadeIn 0.2s ease-out",
        }}>
            {/* Header */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom: "1px solid #1e293b",
                background: "#060b14",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>📦</span>
                    <span style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#e2e8f0",
                        letterSpacing: "0.02em",
                    }}>
                        ZIP Preview
                    </span>
                    <span style={{
                        fontSize: 10,
                        color: "#64748b",
                        background: "#1e293b",
                        padding: "2px 8px",
                        borderRadius: 10,
                        fontFamily: "monospace",
                    }}>
                        {loadingTree ? "Calculating..." : `${files.length} files · ${formatBytes(totalSize)}`}
                    </span>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: "none",
                        border: "none",
                        color: "#475569",
                        cursor: "pointer",
                        fontSize: 16,
                        padding: "2px 6px",
                        borderRadius: 4,
                        transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#e2e8f0"; e.currentTarget.style.background = "#1e293b"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "#475569"; e.currentTarget.style.background = "none"; }}
                >
                    ✕
                </button>
            </div>

            {/* File name display */}
            <div style={{
                padding: "8px 16px",
                borderBottom: "1px solid #1e293b11",
                display: "flex",
                alignItems: "center",
                gap: 8,
            }}>
                <span style={{ fontSize: 11, color: "#475569" }}>Output:</span>
                <span style={{ fontSize: 12, color: "#fb923c", fontFamily: "monospace", fontWeight: 600 }}>
                    {projectName}-{ide}.zip
                </span>
            </div>

            {/* Tree */}
            <div style={{
                padding: "8px 8px",
                maxHeight: 300,
                overflowY: "auto",
            }}>
                {loadingTree ? (
                    <div style={{ padding: 20, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                        Calculating tree footprint...
                    </div>
                ) : (
                    <TreeNode node={tree} depth={0} />
                )}
            </div>

            {/* Footer with download button */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 8,
                padding: "10px 16px",
                borderTop: "1px solid #1e293b",
                background: "#060b14",
            }}>
                <button
                    onClick={onClose}
                    style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: "1px solid #1e293b",
                        background: "#0f172a",
                        color: "#94a3b8",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        transition: "all 0.2s",
                    }}
                >
                    Cancel
                </button>
                <button
                    onClick={handleDownload}
                    disabled={downloading}
                    style={{
                        padding: "8px 20px",
                        borderRadius: 8,
                        border: "1px solid #22c55e40",
                        background: downloading
                            ? "#064e3b"
                            : "linear-gradient(135deg, #064e3b 0%, #0f172a 100%)",
                        color: "#4ade80",
                        cursor: downloading ? "wait" : "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        transition: "all 0.2s",
                        boxShadow: "0 0 12px #22c55e15",
                    }}
                >
                    {downloading ? "⏳ Generating..." : "📥 Download ZIP"}
                </button>
            </div>
        </div>
    );
}
