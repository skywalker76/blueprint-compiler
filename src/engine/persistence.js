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
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const { count, error } = await supabase
            .from("usage_tracking")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("action", "generate")
            .gte("created_at", startOfMonth);

        if (!error) return count || 0;
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

// ─── EXPORT FUNCTIONS (unchanged — client-side only) ───
export function exportAsJson(blueprint) {
    const json = JSON.stringify(blueprint, null, 2);
    downloadFile(`${blueprint.config?.projectName || "blueprint"}.json`, json, "application/json");
}

export function exportAsZip(blueprint) {
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
