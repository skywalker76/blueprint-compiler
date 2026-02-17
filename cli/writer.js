// ─── CLI FILE WRITER ───
// Writes generated Blueprint files to the correct IDE-specific paths

import * as fs from "fs";
import * as path from "path";
import { FILE_TYPES, IDE_TARGETS } from "../src/data/constants.js";

// ─── COLORS ───
const C = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
    green: "\x1b[32m",
    cyan: "\x1b[36m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    gray: "\x1b[90m",
    orange: "\x1b[38;5;208m",
};

// ─── MAP FILE TYPE → IDE PATH ───
export function getFilePath(fileTypeId, ideTarget) {
    const ide = IDE_TARGETS.find(t => t.id === ideTarget);
    if (!ide) return null;

    const pathMap = {
        rules: ide.rulesPath,
        skills: ide.skillsPath + "blueprint-skills.md",
        workflows: ide.workflowsPath + "development.md",
        context: ide.contextPath + "architecture-decisions.md",
        prompt: ide.promptPath,
    };

    return pathMap[fileTypeId] || null;
}

// ─── WRITE ALL FILES ───
export function writeBlueprint(results, ideTarget, projectDir = ".") {
    console.log(`\n${C.bold}${C.orange}  ═══ Writing Blueprint Files ═══${C.reset}\n`);

    const written = [];
    const skipped = [];

    for (const [fileTypeId, result] of Object.entries(results)) {
        if (!result.output || result.error) {
            skipped.push({ id: fileTypeId, reason: result.error || "No output" });
            continue;
        }

        const relPath = getFilePath(fileTypeId, ideTarget);
        if (!relPath) {
            skipped.push({ id: fileTypeId, reason: "Unknown file path" });
            continue;
        }

        const fullPath = path.resolve(projectDir, relPath);
        const dir = path.dirname(fullPath);

        // Create directory if needed
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Check if file exists
        if (fs.existsSync(fullPath)) {
            const existing = fs.readFileSync(fullPath, "utf-8");
            if (existing === result.output) {
                console.log(`  ${C.gray}≡${C.reset} ${relPath} ${C.dim}(unchanged)${C.reset}`);
                skipped.push({ id: fileTypeId, reason: "Unchanged" });
                continue;
            }
            // Overwrite with backup
            const backupPath = fullPath + ".backup";
            fs.copyFileSync(fullPath, backupPath);
            console.log(`  ${C.yellow}↻${C.reset} ${relPath} ${C.dim}(backup → ${path.basename(backupPath)})${C.reset}`);
        }

        // Write file
        fs.writeFileSync(fullPath, result.output, "utf-8");

        const fileMeta = FILE_TYPES.find(f => f.id === fileTypeId);
        const lines = result.output.split("\n").length;
        const score = result.quality?.score || 0;
        const grade = result.quality?.grade || "?";
        const refined = result.refined ? ` ${C.cyan}[refined]${C.reset}` : "";

        console.log(`  ${C.green}✓${C.reset} ${relPath} ${C.dim}(${lines} lines, score: ${score} ${grade})${C.reset}${refined}`);
        written.push({ id: fileTypeId, path: relPath, lines, score, grade });
    }

    // Summary
    console.log(`\n${C.bold}  ─── Summary ───${C.reset}`);
    console.log(`  ${C.green}Written:${C.reset} ${written.length} files`);
    if (skipped.length > 0) {
        console.log(`  ${C.yellow}Skipped:${C.reset} ${skipped.length} (${skipped.map(s => s.id).join(", ")})`);
    }

    const avgScore = written.length > 0
        ? Math.round(written.reduce((sum, w) => sum + w.score, 0) / written.length)
        : 0;
    console.log(`  ${C.dim}Avg quality:${C.reset} ${avgScore}/100`);
    console.log(`\n${C.green}${C.bold}  ✨ Blueprint ready! ${C.reset}${C.dim}Your AI coding agent now has superpowers.${C.reset}\n`);

    return { written, skipped };
}
