// ─── CLI FILE WRITER ───
// Writes generated Blueprint files to the correct IDE-specific paths
import https from "https";

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
export async function writeBlueprint(results, ideTarget, projectDir = ".") {
    console.log(`\n${C.bold}${C.orange}  ═══ Writing Blueprint Files ═══${C.reset}\n`);

    const written = [];
    const skipped = [];

    for (const [fileTypeId, result] of Object.entries(results)) {
        if (!result.output || result.error) {
            skipped.push({ id: fileTypeId, reason: result.error || "No output" });
            continue;
        }

        // SPECAL CASE FOR SKILLS
        if (fileTypeId === "skills") {
            const ide = IDE_TARGETS.find(t => t.id === ideTarget);
            const basePath = ide ? ide.skillsPath : ".agent/skills/";

            let contentToParse = result.output;
            let registrySkills = [];

            // Extract official registry skills
            const match = contentToParse.match(/```(?:json)?\s*(\{[\s\S]*?"selected_registry_skills"[\s\S]*?\})\s*```/i) ||
                contentToParse.match(/(\{[\s\S]*?"selected_registry_skills"[\s\S]*?\})/i);

            if (match) {
                try {
                    const json = JSON.parse(match[1] || match[0]);
                    registrySkills = json.selected_registry_skills || [];
                    contentToParse = contentToParse.replace(match[0], "");
                } catch (e) { }
            }

            // Write custom skills
            const skills = parseSkillsIntoFiles(contentToParse);
            let totalSkillsWritten = 0;

            for (const skill of skills) {
                const fullSkillPath = path.resolve(projectDir, basePath, skill.folderName, "SKILL.md");
                const dir = path.dirname(fullSkillPath);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(fullSkillPath, skill.content, "utf-8");
                totalSkillsWritten++;
                console.log(`  ${C.green}✓${C.reset} ${basePath}${skill.folderName}/SKILL.md ${C.dim}(custom skill)${C.reset}`);
            }

            // Download official skills
            for (const skillId of registrySkills) {
                try {
                    const content = await fetchSkillFromRegistry(skillId);
                    if (content) {
                        let finalContent = content;
                        if (ideTarget === "cursor" && !finalContent.trim().startsWith("---")) {
                            finalContent = `---\ndescription: "Official ${skillId} best practices"\nglobs: ["*"]\nalwaysApply: false\n---\n\n` + finalContent;
                        }
                        const fullSkillPath = path.resolve(projectDir, basePath, skillId, "SKILL.md");
                        const dir = path.dirname(fullSkillPath);
                        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                        fs.writeFileSync(fullSkillPath, finalContent, "utf-8");
                        totalSkillsWritten++;
                        console.log(`  ${C.green}✓${C.reset} ${basePath}${skillId}/SKILL.md ${C.dim}(official registry)${C.reset}`);
                    }
                } catch (e) {
                    console.log(`  ${C.red}✗${C.reset} Failed to download official skill: ${skillId}`);
                }
            }

            written.push({ id: fileTypeId, path: basePath, lines: 0, score: result.quality?.score || 0, grade: result.quality?.grade || "?" });
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

// ─── HELPER: FETCH REGISTRY SKILL ───
function fetchSkillFromRegistry(skillId) {
    return new Promise((resolve, reject) => {
        const url = `https://blueprint-compiler.vercel.app/registry/skills/${skillId}.md`;
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                return resolve(null);
            }
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => resolve(data));
        }).on("error", err => reject(err));
    });
}

// ─── HELPER: PARSE SKILLS ───
export function parseSkillsIntoFiles(skillsOutput) {
    // This splits a single giant markdown blob into individual skill objects
    // Look for lines starting with "---"
    const lines = skillsOutput.split("\\n");
    const skills = [];
    let currentSkill = null;
    let inFrontmatter = false;
    let frontmatterLines = [];
    let contentLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.trim() === "---") {
            if (!inFrontmatter) {
                // Starting a new skill
                if (currentSkill) {
                    currentSkill.content = frontmatterLines.join("\\n") + "\\n" + contentLines.join("\\n");
                    skills.push(currentSkill);
                }
                currentSkill = { name: "Untitled_Skill", folderName: "untitled", content: "" };
                inFrontmatter = true;
                frontmatterLines = ["---"];
                contentLines = [];
            } else {
                // Ending frontmatter
                inFrontmatter = false;
                frontmatterLines.push("---");
                // Try to parse name from frontmatter
                const nameMatch = frontmatterLines.find(l => l.startsWith("name:"));
                if (nameMatch) {
                    currentSkill.name = nameMatch.replace("name:", "").replace(/['"]/g, "").trim();
                    currentSkill.folderName = currentSkill.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                }
            }
        } else {
            if (inFrontmatter) {
                frontmatterLines.push(line);
            } else {
                if (currentSkill) contentLines.push(line);
            }
        }
    }

    if (currentSkill) {
        currentSkill.content = frontmatterLines.join("\\n") + "\\n" + contentLines.join("\\n");
        skills.push(currentSkill);
    }

    return skills;
}
