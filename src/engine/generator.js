// ─── AGENTIC GENERATION ENGINE ───
// Multi-step: Generate → Validate → Refine
import { IDE_TARGETS, FILE_TYPES } from "../data/constants.js";
import { validateOutput } from "./validator.js";
import { getProvider } from "./providers/index.js";

// ─── META-TEMPLATE SYSTEM PROMPT ───
const META_TEMPLATE_SYSTEM = `You are a Context Engineering Blueprint Compiler. You generate production-ready Blueprint files for AI coding agents.

## 7 FUNDAMENTAL PRINCIPLES
1. Enforcement > Guidelines — every rule must have a technical enforcement mechanism
2. Progressive Disclosure — load context only when needed (skills on-demand, not always)
3. Adaptive Governance — plan complexity gates execution:
   - Complexity 1-2 (typos, CSS, small utils): execute immediately, no plan required
   - Complexity 3-5 (new features, DB schema, auth, architecture): STOP, generate plan, wait for approval
4. Compilable Snippets — every code snippet must be syntactically valid, copy-pasteable
5. Total Internal Coherence — no rule contradicts another, all paths/tools referenced exist
6. Global/Project Separation — global contains ONLY thinking protocol + git discipline. Language, identity, plan mode, security → project level
7. Core vs Stack Separation — security, TypeScript rigor, and clean code rules are CORE (immutable). Stack choices (ORM, API layer, auth provider) are STACK (swappable without regeneration)

## GLOBAL FILES (identical for ALL domains — never changes)
~/.gemini/GEMINI.md (~15 lines): Thinking Protocol + Git Discipline only
~/.gemini/settings.json: coreTools [terminal,filesystem,web], excludeTools [rm -rf, sudo], mcpServers [project-specific]

## LAYER 2: WORKSPACE RULES (.antigravity/rules.md) — 13 sections:
1. Language & Identity (conversation language + code language + senior role)
2. Plan Mode Contract (adaptive: complexity-gated, NOT absolute)
3. Terminal Restrictions (project-specific tool blocks beyond global)
4. Code Quality Standards [CORE] (language-specific: strict types, no any, validation)
5. Security First [CORE] (framework-specific checklist)
6. Project Mission (one-line product description)
7. Architecture & Stack [STACK] (modern stable patterns — reference features not patch versions)
8. File Convention Map (where each file type goes, naming patterns)
9. Git Discipline (branch naming, commit format, PR template)
10. Testing Requirements (coverage %, frameworks, run commands)
11. Performance Budgets (bundle size, LCP, response time)
12. Error Handling (logging format, error codes, retry policies)
13. Accessibility (WCAG level, testing tools)

IMPORTANT: In section 7, reference stack technologies by their STABLE FEATURE SET, not by patch version.
Example: "Next.js App Router (Server Components, Server Actions)" NOT "Next.js 15.0.3".
If the user provides specific versions, include them. Otherwise, use "latest stable" semantics.
Mark [CORE] sections as immutable. Mark [STACK] sections with: "Adaptable: if you prefer [alternative], maintain [CORE] rules while swapping this layer."

## LAYER 3: SKILLS (.agent/skills/) — 5-8 domain-specific skills
Each skill: SKILL.md with YAML frontmatter (name, description), activation triggers, step-by-step workflow, templates, constraints, anti-patterns.

## LAYER 4: WORKFLOWS (.agent/workflows/) — 2-4 workflows
Numbered steps, verification after each, rollback instructions.

## LAYER 5: CONTEXT (.context/) — ADR + Style Guide
ADRs: one per major technology choice. Style guide: language-specific conventions.

## LAYER 6: ENFORCEMENT MAP
Maps each rule to enforcement (lint rule, git hook, CI check, test).

## OUTPUT RULES
- Dense, imperative language. No explanatory prose — only WHAT and HOW
- Write ALL content in the user's specified code language (usually English for code)
- Conversation with user in their specified conversation language
- Generate complete, production-ready files — no placeholders like [TODO] or [INSERT]
- Every code snippet must be valid for the chosen stack
- Be opinionated — make concrete technology choices, not generic suggestions
- Include line counts and file paths in your output
- Optimize for context window efficiency: compress without losing precision`;

// ─── RIGOR LEVEL MODIFIERS ───
const RIGOR_MODIFIERS = {
    strict: `\n\n## RIGOR: STRICT (Enterprise/Production)
- Plan Mode: ALWAYS required, even for small changes
- Testing: 90%+ coverage mandatory, no exceptions
- Security: full OWASP checklist, CSP headers, rate limiting
- Code review: required before merge
- Zero tolerance for shortcuts`,
    balanced: `\n\n## RIGOR: BALANCED (Recommended)
- Plan Mode: complexity-gated (skip for trivial, require for complex)
- Testing: 80%+ coverage, critical paths mandatory
- Security: essential checklist (auth, input validation, CSRF)
- Pragmatic trade-offs allowed with documented rationale`,
    rapid: `\n\n## RIGOR: RAPID (Prototype/MVP)
- Plan Mode: only for architectural decisions
- Testing: critical paths only, integration over unit
- Security: authentication + input validation minimum
- Speed over perfection — ship fast, refactor later
- Technical debt tracking required (TODO with ticket refs)`,
};

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
    const rigor = config.rigor || "balanced";

    let prompt = `Generate the **${fileMeta?.label || fileType}** file (${fileMeta?.layer || ""}) for this project:

## Project Configuration
- **Project Name:** ${config.projectName || "Untitled"}
- **Domain:** ${config.domain || "custom"}
- **Mission:** ${config.mission || "No mission defined"}
- **Conversation Language:** ${config.conversationLang || "English"}
- **Code Language:** ${config.codeLang || "English"}
- **Architecture Priorities:** ${priorities || "Not specified"}
- **Blueprint Rigor:** ${rigor.toUpperCase()}
${config.customDomain ? `- **Custom Domain Description:** ${config.customDomain}` : ""}

## Technology Stack
${stackSummary || "Not configured — use sensible defaults for the domain"}
IMPORTANT: Reference stack by stable feature set. Include version ONLY if user explicitly provided it.

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
Include file paths relative to the target IDE's directory structure.
Separate [CORE] rules (security, types, clean code) from [STACK] rules (ORM, API layer, auth provider) with clear markers.`;

    return prompt;
}

// ─── GENERATE SINGLE FILE (AGENTIC: with validation + refinement) ───
export async function generateFile(fileType, apiKey, config, ideTarget, onProgress, providerId, modelId) {
    const provider = getProvider(providerId);
    const ide = IDE_TARGETS.find(t => t.id === ideTarget) || IDE_TARGETS[0];
    const rigor = config.rigor || "balanced";
    const baseSystem = IDE_ADAPTERS[ide.id]?.(META_TEMPLATE_SYSTEM) || META_TEMPLATE_SYSTEM;
    const systemPrompt = baseSystem + (RIGOR_MODIFIERS[rigor] || RIGOR_MODIFIERS.balanced);
    const userPrompt = buildPrompt(fileType, config, ideTarget);

    // Step 1: Generate
    onProgress?.({ phase: "generating", fileType, step: 1, total: 2 });
    const rawOutput = await provider.call(apiKey, systemPrompt, userPrompt, modelId);

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

        const refinedOutput = await provider.call(apiKey, systemPrompt, userPrompt + "\n\n" + refinePrompt, modelId);
        const refinedReport = validateOutput(refinedOutput, fileType, config);

        return { output: refinedOutput, quality: refinedReport, refined: true };
    }

    return { output: rawOutput, quality: report, refined: false };
}

// ─── GENERATE ALL FILES ───
export async function generateAll(apiKey, config, ideTarget, onFileProgress, providerId, modelId) {
    const results = {};
    const fileTypes = FILE_TYPES.map(f => f.id);

    for (const fileType of fileTypes) {
        try {
            onFileProgress?.(fileType, "start");
            const result = await generateFile(fileType, apiKey, config, ideTarget, (p) => {
                onFileProgress?.(fileType, p.phase);
            }, providerId, modelId);
            results[fileType] = result;
            onFileProgress?.(fileType, "done");
        } catch (err) {
            results[fileType] = { output: "", quality: { score: 0, issues: [{ category: "error", message: err.message }] }, error: err.message };
            onFileProgress?.(fileType, "error");
        }
    }

    return results;
}
