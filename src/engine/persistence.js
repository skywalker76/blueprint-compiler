// ─── BLUEPRINT PERSISTENCE ───
// Save/load Blueprints from localStorage

const STORAGE_KEY = "blueprint-compiler-library";
const MAX_FREE_BLUEPRINTS = 3;

// ─── SAVE BLUEPRINT ───
export function saveBlueprint(blueprint) {
    const library = loadLibrary();
    const existing = library.findIndex(b => b.id === blueprint.id);

    if (existing >= 0) {
        library[existing] = { ...blueprint, updatedAt: new Date().toISOString() };
    } else {
        library.unshift({
            ...blueprint,
            id: blueprint.id || generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
        return { success: true, id: blueprint.id || library[0].id };
    } catch (e) {
        return { success: false, error: "Storage full. Delete some blueprints to save new ones." };
    }
}

// ─── LOAD LIBRARY ───
export function loadLibrary() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

// ─── DELETE BLUEPRINT ───
export function deleteBlueprint(id) {
    const library = loadLibrary().filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    return library;
}

// ─── EXPORT AS JSON ───
export function exportAsJson(blueprint) {
    const json = JSON.stringify(blueprint, null, 2);
    downloadFile(`${blueprint.config?.projectName || "blueprint"}.json`, json, "application/json");
}

// ─── EXPORT AS ZIP (simplified — creates a folder structure in a single download) ───
export function exportAsZip(blueprint) {
    // Since we're client-side only, we export as a structured JSON that can be unpacked
    // A real ZIP would require a library like JSZip
    const files = {};
    const ide = blueprint.ideTarget || "antigravity";

    for (const [fileType, result] of Object.entries(blueprint.generated || {})) {
        if (result?.output) {
            const filename = getOutputFilename(fileType, ide);
            files[filename] = result.output;
        }
    }

    const exportData = {
        meta: {
            generator: "Blueprint Compiler v2.0",
            exportedAt: new Date().toISOString(),
            ideTarget: ide,
            project: blueprint.config?.projectName || "Untitled",
            domain: blueprint.config?.domain || "custom",
        },
        files,
    };

    downloadFile(
        `${blueprint.config?.projectName || "blueprint"}-${ide}.json`,
        JSON.stringify(exportData, null, 2),
        "application/json"
    );
}

// ─── IMPORT FROM JSON ───
export function importFromJson(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        if (data.config && data.generated) {
            return { success: true, blueprint: data };
        }
        return { success: false, error: "Invalid Blueprint format. Expected config and generated fields." };
    } catch {
        return { success: false, error: "Invalid JSON file." };
    }
}

// ─── HELPERS ───
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function getOutputFilename(fileType, ideTarget) {
    const paths = {
        antigravity: { rules: ".antigravity/rules.md", skills: ".agent/skills/SKILL.md", workflows: ".agent/workflows/workflow.md", context: ".context/ADR.md", prompt: "PROMPT_START.md" },
        cursor: { rules: ".cursor/rules/blueprint.mdc", skills: ".cursor/rules/skills.mdc", workflows: ".cursor/rules/workflows.mdc", context: ".context/ADR.md", prompt: ".cursor/rules/overview.mdc" },
        copilot: { rules: ".github/copilot-instructions.md", skills: ".github/copilot/skills.md", workflows: ".github/copilot/workflows.md", context: ".context/ADR.md", prompt: ".github/copilot/overview.md" },
        windsurf: { rules: ".windsurfrules", skills: ".windsurf/skills/SKILL.md", workflows: ".windsurf/workflows/workflow.md", context: ".context/ADR.md", prompt: ".windsurf/overview.md" },
    };
    return paths[ideTarget]?.[fileType] || `${fileType}.md`;
}

// ─── USAGE COUNT TRACKING (for free tier limits) ───
const USAGE_KEY = "blueprint-compiler-usage";

export function getUsageCount() {
    try {
        const raw = localStorage.getItem(USAGE_KEY);
        const data = raw ? JSON.parse(raw) : { count: 0, month: new Date().getMonth() };

        // Reset count if new month
        if (data.month !== new Date().getMonth()) {
            data.count = 0;
            data.month = new Date().getMonth();
            localStorage.setItem(USAGE_KEY, JSON.stringify(data));
        }

        return data.count;
    } catch {
        return 0;
    }
}

export function incrementUsage() {
    const raw = localStorage.getItem(USAGE_KEY);
    const data = raw ? JSON.parse(raw) : { count: 0, month: new Date().getMonth() };
    data.count++;
    localStorage.setItem(USAGE_KEY, JSON.stringify(data));
}
