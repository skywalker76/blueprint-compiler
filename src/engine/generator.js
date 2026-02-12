// ─── AGENTIC GENERATION ENGINE ───
// Multi-step: Generate → Validate → Refine
import { IDE_TARGETS, FILE_TYPES } from "../data/constants.js";
import { validateOutput } from "./validator.js";

// ─── META-TEMPLATE SYSTEM PROMPT ───
const META_TEMPLATE_SYSTEM = `You are a Context Engineering Blueprint Compiler. You generate production-ready Blueprint files for AI coding agents.

## 6 FUNDAMENTAL PRINCIPLES
1. Enforcement > Guidelines — every rule must have a technical enforcement mechanism
2. Progressive Disclosure — load context only when needed (skills on-demand, not always)
3. Plan First, Code Second — never write code without an approved implementation plan
4. Compilable Snippets — every code snippet must be syntactically valid, copy-pasteable
5. Total Internal Coherence — no rule contradicts another, all paths/tools referenced exist
6. Global/Project Separation — global contains ONLY thinking protocol + git discipline. Language, identity, plan mode, security → project level

## GLOBAL FILES (identical for ALL domains — never changes)
~/.gemini/GEMINI.md (~15 lines): Thinking Protocol + Git Discipline only
~/.gemini/settings.json: coreTools [terminal,filesystem,web], excludeTools [rm -rf, sudo], mcpServers [project-specific]

## LAYER 2: WORKSPACE RULES (.antigravity/rules.md) — 13 sections:
1. Language & Identity (conversation language + code language + senior role)
2. Plan Mode Contract (implementation plan template with STOP-and-wait)
3. Terminal Restrictions (project-specific tool blocks beyond global)
4. Code Quality Standards (language-specific: strict types, no any, validation)
5. Security First (framework-specific checklist)
6. Project Mission (one-line product description)
7. Architecture & Stack (exact versions, no alternatives)
8. File Convention Map (where each file type goes, naming patterns)
9. Git Discipline (branch naming, commit format, PR template)
10. Testing Requirements (coverage %, frameworks, run commands)
11. Performance Budgets (bundle size, LCP, response time)
12. Error Handling (logging format, error codes, retry policies)
13. Accessibility (WCAG level, testing tools)

## LAYER 3: SKILLS (.agent/skills/) — 5-8 domain-specific skills
Each skill file structure: SKILL.md with YAML frontmatter (name, description), activation triggers, step-by-step workflow, templates, constraints, anti-patterns.

## LAYER 4: WORKFLOWS (.agent/workflows/) — 2-4 workflows
Step-by-step procedures with numbered steps, verification after each step, rollback instructions.

## LAYER 5: CONTEXT (.context/) — ADR + Style Guide
Architecture Decision Records: one ADR per major technology choice. Style guide: language-specific conventions.

## LAYER 6: ENFORCEMENT MAP
Maps each rule to a concrete enforcement mechanism (lint rule, git hook, CI check, test).

## OUTPUT RULES
- Write ALL content in the user's specified code language (usually English for code)
- Conversation with user in their specified conversation language
- Generate complete, production-ready files — no placeholders like [TODO] or [INSERT]
- Every code snippet must be valid for the chosen stack
- Be opinionated — make concrete technology choices, not generic suggestions
- Include line counts and file paths in your output`;

// ─── IDE-SPECIFIC PROMPT ADAPTERS ───
const IDE_ADAPTERS = {
    antigravity: (basePrompt) => basePrompt,
    cursor: (basePrompt) => basePrompt + `

## IDE-SPECIFIC: CURSOR
- Output rules.md as .mdc format with YAML frontmatter: description, globs, alwaysApply
- Use .cursor/rules/ directory for all rule files
- Keep each rule file under 2000 tokens for optimal loading
- Skills become separate .mdc files with relevant glob patterns
- Reference: https://docs.cursor.com/context/rules`,
    copilot: (basePrompt) => basePrompt + `

## IDE-SPECIFIC: GITHUB COPILOT
- Output as .github/copilot-instructions.md (single file for core rules)
- Keep instructions concise — Copilot has a smaller context window
- Focus on coding conventions, architecture patterns, and naming
- Skills become additional instruction files in .github/copilot/
- Reference: https://docs.github.com/en/copilot/customizing-copilot`,
    windsurf: (basePrompt) => basePrompt + `

## IDE-SPECIFIC: WINDSURF (CODEIUM)
- Output as .windsurfrules at project root
- Format: markdown with clear section headers
- Cascade (agentic mode) reads this file automatically
- Skills become separate files in .windsurf/skills/
- Keep rules actionable and specific for Cascade's agent loop`,
};

// ─── REFINEMENT PROMPT ───
const REFINEMENT_PROMPT = `You previously generated a Blueprint file but the quality checker found these issues:

{ISSUES}

Please regenerate the file fixing ALL the issues listed above. The output must:
1. Contain all expected sections with proper headings
2. Reference the EXACT stack technologies configured (not generic ones)
3. Have NO placeholder text like [TODO], [INSERT], [YOUR], or [CUSTOMIZE]
4. Be at least {MIN_LINES} lines long
5. Be complete and production-ready`;

// ─── BUILD PROMPT ───
export function buildPrompt(fileType, config, ideTarget) {
    const ide = IDE_TARGETS.find(t => t.id === ideTarget) || IDE_TARGETS[0];
    const fileMeta = FILE_TYPES.find(f => f.id === fileType);

    const stackSummary = Object.entries(config.stack || {})
        .map(([k, v]) => `- ${k}: ${v}`)
        .join("\n");

    const priorities = (config.priorities || []).join(", ");

    let prompt = `Generate the **${fileMeta?.label || fileType}** file (${fileMeta?.layer || ""}) for this project:

## Project Configuration
- **Project Name:** ${config.projectName || "Untitled"}
- **Domain:** ${config.domain || "custom"}
- **Mission:** ${config.mission || "No mission defined"}
- **Conversation Language:** ${config.conversationLang || "English"}
- **Code Language:** ${config.codeLang || "English"}
- **Architecture Priorities:** ${priorities || "Not specified"}
${config.customDomain ? `- **Custom Domain Description:** ${config.customDomain}` : ""}

## Technology Stack
${stackSummary || "Not configured — use sensible defaults for the domain"}

## Target IDE: ${ide.name}
- Rules path: ${ide.rulesPath}
- Skills path: ${ide.skillsPath}
- Workflows path: ${ide.workflowsPath}
- Context path: ${ide.contextPath}
- Config format: ${ide.configFormat}

## Expected Output
Generate a complete, production-ready ${fileMeta?.label || fileType} file.
Expected length: ${fileMeta?.lines || "200-400"} lines.
${fileMeta?.expectedSections ? `Must contain at least ${fileMeta.expectedSections} major sections.` : ""}
Include file paths relative to the target IDE's directory structure.`;

    return prompt;
}

// ─── GENERATE SINGLE FILE (AGENTIC: with validation + refinement) ───
export async function generateFile(fileType, apiKey, config, ideTarget, onProgress) {
    const ide = IDE_TARGETS.find(t => t.id === ideTarget) || IDE_TARGETS[0];
    const systemPrompt = IDE_ADAPTERS[ide.id]?.(META_TEMPLATE_SYSTEM) || META_TEMPLATE_SYSTEM;
    const userPrompt = buildPrompt(fileType, config, ideTarget);

    // Step 1: Generate
    onProgress?.({ phase: "generating", fileType, step: 1, total: 2 });
    const rawOutput = await callClaude(apiKey, systemPrompt, userPrompt);

    // Step 2: Validate
    onProgress?.({ phase: "validating", fileType, step: 1.5, total: 2 });
    const report = validateOutput(rawOutput, fileType, config);

    // Step 3: Refine if quality < 75
    if (report.score < 75) {
        onProgress?.({ phase: "refining", fileType, step: 2, total: 2 });
        const fileMeta = FILE_TYPES.find(f => f.id === fileType);
        const issuesList = report.issues.map(i => `- [${i.category}] ${i.message}`).join("\n");
        const refinePrompt = REFINEMENT_PROMPT
            .replace("{ISSUES}", issuesList)
            .replace("{MIN_LINES}", String(parseInt(fileMeta?.lines || "200")));

        const refinedOutput = await callClaude(apiKey, systemPrompt, userPrompt + "\n\n" + refinePrompt);
        const refinedReport = validateOutput(refinedOutput, fileType, config);

        return { output: refinedOutput, quality: refinedReport, refined: true };
    }

    return { output: rawOutput, quality: report, refined: false };
}

// ─── GENERATE ALL FILES ───
export async function generateAll(apiKey, config, ideTarget, onFileProgress) {
    const results = {};
    const fileTypes = FILE_TYPES.map(f => f.id);

    for (const fileType of fileTypes) {
        try {
            onFileProgress?.(fileType, "start");
            const result = await generateFile(fileType, apiKey, config, ideTarget, (p) => {
                onFileProgress?.(fileType, p.phase);
            });
            results[fileType] = result;
            onFileProgress?.(fileType, "done");
        } catch (err) {
            results[fileType] = { output: "", quality: { score: 0, issues: [{ category: "error", message: err.message }] }, error: err.message };
            onFileProgress?.(fileType, "error");
        }
    }

    return results;
}

// ─── CLAUDE API CALL ───
async function callClaude(apiKey, systemPrompt, userPrompt) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 8000,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
        }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.content?.map(b => b.text || "").join("\n") || "";
}
