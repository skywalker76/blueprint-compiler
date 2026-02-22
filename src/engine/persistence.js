// ─── BLUEPRINT PERSISTENCE ───
// Dual-mode: Supabase (authenticated) → localStorage (fallback)
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

const STORAGE_KEY = "blueprint-compiler-library";
const USAGE_KEY = "blueprint-compiler-usage";
const TELEMETRY_KEY = "blueprint-compiler-telemetry";
const MAX_FREE_BLUEPRINTS = 3;

// ─── SAVE BLUEPRINT ───
export async function saveBlueprint(blueprint, userId = null) {
    // Cloud save if authenticated
    if (userId && isSupabaseConfigured()) {
        try {
            const record = {
                user_id: userId,
                project_name: blueprint.config?.projectName || "Untitled",
                domain: blueprint.config?.domain || "custom",
                mission: blueprint.config?.mission || "",
                ide_target: blueprint.ideTarget || "antigravity",
                rigor: blueprint.config?.rigor || "balanced",
                config: blueprint.config || {},
                generated: blueprint.generated || {},
                quality_score: blueprint.quality?.score || null,
            };

            if (blueprint.supabaseId) {
                // Update existing
                const { data, error } = await supabase
                    .from("blueprints")
                    .update({ ...record, updated_at: new Date().toISOString() })
                    .eq("id", blueprint.supabaseId)
                    .select()
                    .single();
                if (error) throw error;
                return { success: true, id: data.id, source: "cloud" };
            } else {
                // Insert new
                const { data, error } = await supabase
                    .from("blueprints")
                    .insert(record)
                    .select()
                    .single();
                if (error) throw error;
                return { success: true, id: data.id, source: "cloud" };
            }
        } catch (err) {
            console.warn("[Persistence] Cloud save failed, falling back to localStorage:", err.message);
            // Fall through to localStorage
        }
    }

    // Fallback: localStorage
    return saveBlueprintLocal(blueprint);
}

// ─── LOAD LIBRARY ───
export async function loadLibrary(userId = null) {
    if (userId && isSupabaseConfigured()) {
        try {
            const { data, error } = await supabase
                .from("blueprints")
                .select("*")
                .eq("user_id", userId)
                .order("updated_at", { ascending: false });

            if (error) throw error;

            // Merge cloud + local blueprints
            const cloudBlueprints = (data || []).map(row => ({
                id: row.id,
                supabaseId: row.id,
                config: row.config,
                generated: row.generated,
                ideTarget: row.ide_target,
                quality: { score: row.quality_score },
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            }));

            // Also load local blueprints so nothing is lost
            const localBlueprints = loadLibraryLocal();
            // Combine: cloud first, then local ones not already in cloud
            const cloudIds = new Set(cloudBlueprints.map(b => b.config?.projectName));
            const uniqueLocal = localBlueprints.filter(b => !cloudIds.has(b.config?.projectName));
            return [...cloudBlueprints, ...uniqueLocal];
        } catch (err) {
            console.warn("[Persistence] Cloud load failed, using localStorage:", err.message);
        }
    }

    return loadLibraryLocal();
}

// ─── DELETE BLUEPRINT ───
export async function deleteBlueprint(id, userId = null) {
    if (userId && isSupabaseConfigured()) {
        try {
            const { error } = await supabase
                .from("blueprints")
                .delete()
                .eq("id", id)
                .eq("user_id", userId);
            if (error) throw error;
            return await loadLibrary(userId);
        } catch (err) {
            console.warn("[Persistence] Cloud delete failed, using localStorage:", err.message);
        }
    }

    return deleteBlueprintLocal(id);
}

// ─── IMPORT LOCALSTORAGE → SUPABASE (one-time migration) ───
export async function migrateLocalToCloud(userId) {
    if (!userId || !isSupabaseConfigured()) return { migrated: 0 };

    const local = loadLibraryLocal();
    if (local.length === 0) return { migrated: 0 };

    let migrated = 0;
    for (const bp of local) {
        try {
            await saveBlueprint(bp, userId);
            migrated++;
        } catch (e) {
            console.warn("Migration failed for blueprint:", bp.id, e);
        }
    }

    // Clear localStorage after migration
    if (migrated > 0) {
        localStorage.removeItem(STORAGE_KEY);
    }

    return { migrated };
}

// ─── USAGE TRACKING ───
export async function trackUsage(userId, action, details = {}) {
    if (userId && isSupabaseConfigured()) {
        await supabase.from("usage_tracking").insert({
            user_id: userId,
            action,
            blueprint_id: details.blueprintId || null,
            file_type: details.fileType || null,
            tokens_used: details.tokensUsed || null,
            quality_score: details.qualityScore || null,
        });
    }

    // Always track locally too
    incrementUsageLocal();
}

export async function getUsageCount(userId = null) {
    if (userId && isSupabaseConfigured()) {
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            const { count, error } = await supabase
                .from("usage_tracking")
                .select("*", { count: "exact", head: true })
                .eq("user_id", userId)
                .eq("action", "generate")
                .gte("created_at", startOfMonth);

            if (error) {
                console.error("Supabase getUsageCount error:", error);
                return getUsageCountLocal();
            }
            return count || 0;
        } catch (e) {
            console.error("Exception in getUsageCount:", e);
            return getUsageCountLocal();
        }
    }

    return getUsageCountLocal();
}

// ─── TELEMETRY ───
export function getTelemetryPreference() {
    try {
        return localStorage.getItem(TELEMETRY_KEY) === "true";
    } catch {
        return false;
    }
}

export function setTelemetryPreference(enabled) {
    localStorage.setItem(TELEMETRY_KEY, enabled ? "true" : "false");
}

export async function trackAnonymousEvent(event, data = {}) {
    if (!getTelemetryPreference()) return;

    // In a real app, this would send to Posthog, Mixpanel, or Supabase
    // For now, we utilize Supabase if available, allowing null user_id if the schema permits,
    // or just log to console to simulate the "sending" action for verification.
    if (isSupabaseConfigured()) {
        try {
            await supabase.from("usage_tracking").insert({
                user_id: null, // Anonymous
                action: event,
                ...data
            });
        } catch (e) {
            // Provide a graceful fallback or silent fail for telemetry
            console.log("[Telemetry] (Sent)", event, data);
        }
    } else {
        console.log("[Telemetry] (Simulated)", event, data);
    }
}

// ─── EXPORT FUNCTIONS ───
import JSZip from "jszip";
import { IDE_TARGETS, FILE_TYPES } from "../data/constants.js";

// ─── SKILL SPLITTER (A1) ───
// Parses a monolithic skills output into individual skill files
export function parseSkillsIntoFiles(skillsOutput) {
    if (!skillsOutput || typeof skillsOutput !== "string") return [];

    // Split on YAML frontmatter boundaries: ---\nname: ...
    const parts = skillsOutput.split(/(?=^---\s*\n\s*name:\s*)/m).filter(Boolean);

    if (parts.length <= 1) {
        // Fallback: try splitting on markdown H1 headers as skill boundaries
        const h1Parts = skillsOutput.split(/(?=^# )/m).filter(Boolean);
        if (h1Parts.length > 1) {
            return h1Parts.map((content, i) => {
                const titleMatch = content.match(/^# (.+)/m);
                const name = titleMatch ? titleMatch[1].trim() : `skill-${i + 1}`;
                const folderName = slugify(name);
                return { folderName, name, content: content.trim() };
            });
        }
        // Cannot split — return as single skill
        return [{ folderName: "project-skills", name: "Project Skills", content: skillsOutput.trim() }];
    }

    return parts.map((block, i) => {
        const nameMatch = block.match(/name:\s*(.+)/i);
        const name = nameMatch ? nameMatch[1].trim().replace(/["']/g, "") : `skill-${i + 1}`;
        const folderName = slugify(name);
        return { folderName, name, content: block.trim() };
    });
}

function slugify(str) {
    return str.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "skill";
}

function getSkillsBasePath(ideTarget) {
    const basePaths = {
        antigravity: ".agent/skills",
        cursor: ".cursor/rules/skills",
        copilot: ".github/copilot/skills",
        windsurf: ".windsurf/skills",
    };
    return basePaths[ideTarget] || ".agent/skills";
}

// ─── README GENERATOR (A2) ───
export function generateReadme(blueprint) {
    const ide = blueprint.ideTarget || "antigravity";
    const ideMeta = IDE_TARGETS.find(t => t.id === ide) || IDE_TARGETS[0];
    const config = blueprint.config || {};
    const generated = blueprint.generated || {};
    const projectName = config.projectName || "Blueprint";

    const fileDescriptions = {
        rules: "Core workspace rules — architecture, stack, conventions, security",
        skills: "Modular skills loaded on-demand by the AI agent",
        workflows: "Step-by-step workflows the agent follows like checklists",
        context: "Architecture Decision Records + coding style conventions",
        prompt: "Bootstrap file — project overview and quick start",
    };

    let fileList = "";
    for (const [fileType, result] of Object.entries(generated)) {
        if (result?.output) {
            if (fileType === "skills") {
                const skills = parseSkillsIntoFiles(result.output);
                const basePath = getSkillsBasePath(ide);
                for (const skill of skills) {
                    fileList += `- \`${basePath}/${skill.folderName}/SKILL.md\` — ${skill.name}\n`;
                }
            } else {
                const path = getOutputFilename(fileType, ide);
                fileList += `- \`${path}\` — ${fileDescriptions[fileType] || fileType}\n`;
            }
        }
    }

    // IDE-specific install guides (beginner + advanced per IDE)
    const ideGuides = {
        antigravity: {
            qs: "1. **Extract** the ZIP into your project root\n2. **Open** the project in **Antigravity** — it auto-detects `.gemini/` files\n3. **Start a new chat** — your agent has full project context\n4. Try: *\"use the rules file to review this code\"*",
            adv: "**Paths:** Rules → `.gemini/rules.md` · Skills → `.gemini/skills/<name>/SKILL.md` · Workflows → `.gemini/workflows/<name>.md`\n**Invoke a skill:** `use the [skill-name] skill` in chat\n**Run a workflow:** `/workflow-name` in chat",
        },
        cursor: {
            qs: "1. **Extract** the ZIP into your project root\n2. **Open** in **Cursor** (`File → Open Folder`)\n3. **Open a new chat** (Cmd/Ctrl+L) — `.cursorrules` is auto-loaded\n4. Your agent follows your architecture rules on every message",
            adv: "**Paths:** Rules → `.cursorrules` · Skills → `.cursor/skills/<name>/SKILL.md` · Workflows → `.cursor/workflows/<name>.md`\n**Reference a skill:** `@.cursor/skills/<name>/SKILL.md` in chat\n**Team:** commit all `.cursor/` files to git",
        },
        copilot: {
            qs: "1. **Extract** the ZIP into your project root\n2. **Open** in **VS Code** with GitHub Copilot installed\n3. **Open Copilot Chat** (Ctrl+Alt+I)\n4. `.github/copilot-instructions.md` loads automatically — agent is ready",
            adv: "**Paths:** Rules → `.github/copilot-instructions.md` · Skills → `.github/copilot/skills/<name>/SKILL.md`\n**Team:** commit `.github/` to git — every developer benefits automatically",
        },
        windsurf: {
            qs: "1. **Extract** the ZIP into your project root\n2. **Open** in **Windsurf**\n3. **Start a Cascade chat** — `.windsurf/rules.md` loads automatically\n4. Your agent knows your stack and constraints",
            adv: "**Paths:** Rules → `.windsurf/rules.md` · Skills → `.windsurf/skills/<name>/SKILL.md` · Workflows → `.windsurf/workflows/<name>.md`\n**All `.windsurf/` files load into Cascade automatically**",
        },
    };
    const g = ideGuides[ide] || ideGuides.antigravity;

    return `# ${projectName} — AI Agent Blueprint v2.1

> Generated by [Blueprint Compiler](https://blueprint-compiler.vercel.app) v2.1 — ${new Date().toISOString().split("T")[0]}

## 🎯 About This Blueprint

| Property | Value |
|----------|-------|
| **Project** | ${projectName} |
| **Domain** | ${config.domain || "custom"} |
| **IDE Target** | ${ideMeta.icon} ${ideMeta.name} |
| **Rigor** | ${(config.rigor || "balanced").charAt(0).toUpperCase() + (config.rigor || "balanced").slice(1)} |
| **Mission** | ${config.mission || "—"} |

---

## 📁 Files Included

${fileList}
- \`blueprint.json\` — Machine-readable metadata (reimportable into Blueprint Compiler)
- \`README.md\` — This file

---

## 🚀 Quick Start — Beginner Friendly

> **New to AI blueprints? Follow these steps:**

${g.qs}

> ✅ Your AI agent is now configured with the rules, skills, and workflows for **${projectName}**.

---

## ⚙️ Advanced Usage

${g.adv}

---

## 🔄 Keeping Your Blueprint Up To Date

**Option A — Re-import and re-generate:**
1. Go to [blueprint-compiler.vercel.app](https://blueprint-compiler.vercel.app)
2. Click **Import** → upload \`blueprint.json\` to restore your config
3. Edit what changed → click **Generate All**
4. Replace old files with the new ones

**Option B — Edit manually:**
All files are plain Markdown. Open and edit directly — no compilation needed.

---

## 💡 What Each File Does

| File | Purpose | When AI Uses It |
|------|---------|----------------|
| **Rules** | Architecture constraints, stack, security | Every conversation |
| **Skills** | Deep expertise modules (auth, testing, CI/CD) | When you reference them |
| **Workflows** | Step-by-step task checklists | When you invoke them |
| **Context** | Architecture decisions & coding style | Background context |
| **Prompt** | Project overview for the agent | Session initialization |

---

## 🆘 Troubleshooting

**Agent ignores the rules?**
→ Check files are in the correct folder (see Advanced section)
→ Restart your IDE and start a new chat session

**Add a custom rule:**
→ Open the rules file, add a bullet point — one constraint per bullet

**Add a new skill:**
→ Create a folder in the skills directory with a \`SKILL.md\` file
→ Reference it: *"use the [skill-name] skill"*

**Share with your team:**
→ Commit all blueprint files to git — every developer benefits automatically

---

*Built with ❤️ using [Blueprint Compiler v2.1](https://blueprint-compiler.vercel.app)*
`;
}


// ─── ZIP FILE TREE (A3) ───
// Returns tree structure for preview without generating the actual ZIP
export async function getZipFileTree(blueprint) {
    const ide = blueprint.ideTarget || "antigravity";
    const generated = blueprint.generated || {};
    const files = [];

    const fileDescriptions = {
        rules: "Core workspace rules",
        skills: "AI agent skills",
        workflows: "Step-by-step workflows",
        context: "Architecture decisions",
        prompt: "Project bootstrap",
    };

    for (const [fileType, result] of Object.entries(generated)) {
        if (result?.output) {
            if (fileType === "skills") {
                const basePath = getSkillsBasePath(ide);
                let contentToParse = result.output;
                let registrySkills = [];

                // Extract official registry skills JSON block
                const match = contentToParse.match(/```(?:json)?\s*(\{[\s\S]*?"selected_registry_skills"[\s\S]*?\})\s*```/i) ||
                    contentToParse.match(/(\{[\s\S]*?"selected_registry_skills"[\s\S]*?\})/i);

                if (match) {
                    try {
                        const json = JSON.parse(match[1] || match[0]);
                        registrySkills = json.selected_registry_skills || [];
                        contentToParse = contentToParse.replace(match[0], "");
                    } catch (e) { }
                }

                // Custom skills
                const skills = parseSkillsIntoFiles(contentToParse);
                for (const skill of skills) {
                    files.push({
                        path: `${basePath}/${skill.folderName}/SKILL.md`,
                        size: new Blob([skill.content]).size,
                        description: skill.name,
                        type: "skill",
                    });
                }

                // Official skills (async fetch for accurate sizes, or fallback)
                for (const skillId of registrySkills) {
                    let size = 2048; // Estimate 2KB if fetch fails
                    try {
                        const res = await fetch(`/registry/skills/${skillId}.md`);
                        if (res.ok) {
                            const content = await res.text();
                            size = new Blob([content]).size;
                        }
                    } catch (e) { }

                    files.push({
                        path: `${basePath}/${skillId}/SKILL.md`,
                        size,
                        description: `Official: ${skillId}`,
                        type: "skill",
                    });
                }
            } else {
                const path = getOutputFilename(fileType, ide);
                files.push({
                    path,
                    size: new Blob([result.output]).size,
                    description: fileDescriptions[fileType] || fileType,
                    type: fileType,
                });
            }
        }
    }

    // README
    const readme = generateReadme(blueprint);
    files.push({ path: "README.md", size: new Blob([readme]).size, description: "Quick start guide", type: "readme" });

    // Metadata
    const meta = JSON.stringify({ generator: "Blueprint Compiler v2.1", ideTarget: ide, project: blueprint.config?.projectName || "blueprint" }, null, 2);
    files.push({ path: "blueprint.json", size: new Blob([meta]).size, description: "Machine-readable metadata", type: "meta" });

    return files;
}

// — JSON —
export function exportAsJson(blueprint) {
    const json = getBlueprintJsonString(blueprint);
    downloadFile(`${blueprint.config?.projectName || "blueprint"}.json`, json, "application/json");
}

export function getBlueprintJsonString(blueprint) {
    return JSON.stringify(blueprint, null, 2);
}

// — YAML (lightweight serializer — no dependency) —
function toYaml(obj, indent = 0) {
    const pad = "  ".repeat(indent);
    let out = "";
    if (obj === null || obj === undefined) return pad + "null\n";
    if (typeof obj === "string") {
        if (obj.includes("\n") || obj.includes(":") || obj.includes("#") || obj.includes('"')) {
            return `${pad}|\n${obj.split("\n").map(l => pad + "  " + l).join("\n")}\n`;
        }
        return `${pad}${JSON.stringify(obj)}\n`;
    }
    if (typeof obj === "number" || typeof obj === "boolean") return `${pad}${obj}\n`;
    if (Array.isArray(obj)) {
        if (obj.length === 0) return pad + "[]\n";
        for (const item of obj) {
            if (typeof item === "object" && item !== null) {
                out += pad + "-\n" + toYaml(item, indent + 2);
            } else {
                out += pad + "- " + (typeof item === "string" ? JSON.stringify(item) : String(item)) + "\n";
            }
        }
        return out;
    }
    if (typeof obj === "object") {
        for (const [k, v] of Object.entries(obj)) {
            if (v === null || v === undefined) {
                out += `${pad}${k}: null\n`;
            } else if (typeof v === "object") {
                out += `${pad}${k}:\n${toYaml(v, indent + 1)}`;
            } else {
                out += `${pad}${k}: ${toYaml(v, 0).trim()}\n`;
            }
        }
        return out;
    }
    return pad + String(obj) + "\n";
}

export function getBlueprintYamlString(blueprint) {
    const exportData = {
        meta: {
            generator: "Blueprint Compiler v2.0",
            exportedAt: new Date().toISOString(),
            ideTarget: blueprint.ideTarget || "antigravity",
            project: blueprint.config?.projectName || "Untitled",
            domain: blueprint.config?.domain || "custom",
        },
        config: blueprint.config || {},
        files: {},
    };
    for (const [fileType, result] of Object.entries(blueprint.generated || {})) {
        if (result?.output) {
            exportData.files[fileType] = {
                filename: getOutputFilename(fileType, blueprint.ideTarget || "antigravity"),
                quality: result.quality || null,
                content: result.output,
            };
        }
    }
    return "# Blueprint Compiler Export\n---\n" + toYaml(exportData);
}

export function exportAsYaml(blueprint) {
    const yaml = getBlueprintYamlString(blueprint);
    downloadFile(
        `${blueprint.config?.projectName || "blueprint"}.yaml`,
        yaml,
        "text/yaml"
    );
}

// — ZIP (real .zip with IDE-correct folder structure + split skills + README) —
export async function exportAsZip(blueprint) {
    const zip = new JSZip();
    const ide = blueprint.ideTarget || "antigravity";
    const projectName = blueprint.config?.projectName || "blueprint";

    // Add each generated file at its IDE-correct path
    for (const [fileType, result] of Object.entries(blueprint.generated || {})) {
        if (result?.output) {
            if (fileType === "skills") {
                const basePath = getSkillsBasePath(ide);
                let contentToParse = result.output;
                let registrySkills = [];

                // Extract official registry skills JSON block
                const match = contentToParse.match(/```(?:json)?\s*(\{[\s\S]*?"selected_registry_skills"[\s\S]*?\})\s*```/i) ||
                    contentToParse.match(/(\{[\s\S]*?"selected_registry_skills"[\s\S]*?\})/i);

                if (match) {
                    try {
                        const json = JSON.parse(match[1] || match[0]);
                        registrySkills = json.selected_registry_skills || [];
                        contentToParse = contentToParse.replace(match[0], "");
                    } catch (e) {
                        console.error("Failed to parse registry skills JSON", e);
                    }
                }

                // A1: Split custom skills into individual folders
                const skills = parseSkillsIntoFiles(contentToParse);
                for (const skill of skills) {
                    zip.file(`${basePath}/${skill.folderName}/SKILL.md`, skill.content);
                }

                // Add official registry skills
                for (const skillId of registrySkills) {
                    try {
                        const res = await fetch(`/registry/skills/${skillId}.md`);
                        if (res.ok) {
                            let content = await res.text();
                            // Adapt for Cursor (needs .mdc frontmatter if missing)
                            if (ide === "cursor" && !content.trim().startsWith("---")) {
                                content = `---\ndescription: "Official ${skillId} best practices"\nglobs: ["*"]\nalwaysApply: false\n---\n\n` + content;
                            }
                            zip.file(`${basePath}/${skillId}/SKILL.md`, content);
                        } else {
                            console.warn("Skill not found in registry:", skillId);
                        }
                    } catch (e) {
                        console.error("Failed to fetch official skill", skillId, e);
                    }
                }
            } else {
                const path = getOutputFilename(fileType, ide);
                zip.file(path, result.output);
            }
        }
    }

    // A2: Add README
    zip.file("README.md", generateReadme(blueprint));

    // Add metadata
    zip.file("blueprint.json", JSON.stringify({
        generator: "Blueprint Compiler v2.1",
        exportedAt: new Date().toISOString(),
        ideTarget: ide,
        project: projectName,
        domain: blueprint.config?.domain || "custom",
        config: blueprint.config || {},
    }, null, 2));

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName}-${ide}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// — Import —
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

// ═══════════════════════════════════════════════
// LOCAL STORAGE HELPERS (private, fallback only)
// ═══════════════════════════════════════════════

function saveBlueprintLocal(blueprint) {
    const library = loadLibraryLocal();
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
        return { success: true, id: blueprint.id || library[0].id, source: "local" };
    } catch (e) {
        return { success: false, error: "Storage full. Delete some blueprints to save new ones." };
    }
}

function loadLibraryLocal() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function deleteBlueprintLocal(id) {
    const library = loadLibraryLocal().filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    return library;
}

function getUsageCountLocal() {
    try {
        const raw = localStorage.getItem(USAGE_KEY);
        const data = raw ? JSON.parse(raw) : { count: 0, month: new Date().getMonth() };
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

function incrementUsageLocal() {
    const raw = localStorage.getItem(USAGE_KEY);
    const data = raw ? JSON.parse(raw) : { count: 0, month: new Date().getMonth() };
    data.count++;
    localStorage.setItem(USAGE_KEY, JSON.stringify(data));
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
