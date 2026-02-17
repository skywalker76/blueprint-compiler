# AUDIT REQUEST — Blueprint Compiler Meta Prompt

Sei un esperto di prompt engineering e context engineering per AI coding agents.

Analizza il sistema di meta prompt qui sotto — è il cuore di un tool che genera "Blueprint" per AI coding agents (file di configurazione che trasformano un agente AI generico in un architetto specializzato per un progetto specifico).

## Cosa devi analizzare:

1. **Istruzioni ambigue** — dove un LLM potrebbe interpretare diversamente e produrre output inconsistente
2. **Sezioni mancanti** — cosa si aspetterebbe un senior engineer che qui non c'è
3. **Contraddizioni interne** — regole che si contraddicono tra loro
4. **Troppo vago vs troppo rigido** — trova il giusto equilibrio
5. **Output generico** — dove il prompt produce frasi "filler" anziché contenuto specifico per il progetto
6. **Qualità del sistema di validazione** — il validator cattura davvero i problemi importanti?
7. **Edge cases** — progetti senza frontend, monorepo, microservices, solo API backend, mobile-only

Per ogni punto, fornisci:
- Il problema specifico (con citazione dal codice)
- L'impatto sulla qualità dell'output
- La soluzione proposta (con esempio concreto)

---

## FILE 1: generator.js — Il Meta Prompt Engine

```javascript
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

// ─── BUILD PROMPT (assembla il prompt finale per ogni file type) ───
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

// ─── GENERATE SINGLE FILE (AGENTIC: Generate → Validate → Refine) ───
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

// ─── UPDATE MODE: SYSTEM PROMPT ───
const UPDATE_SYSTEM_PROMPT = `You are a Context Engineering Blueprint Updater. You receive an EXISTING Blueprint file and a CHANGE DESCRIPTION. Your job is to INTELLIGENTLY UPDATE the existing file.

## UPDATE RULES
1. PRESERVE all sections that are NOT affected by the change
2. UPDATE only the sections that need modification
3. ADD new sections if the change introduces new concerns
4. REMOVE sections only if they are explicitly obsoleted by the change
5. Maintain the same format, writing style, and structure as the original
6. Keep [CORE] sections (security, types, clean code) intact unless explicitly changed
7. Update [STACK] sections when technologies change
8. Ensure internal coherence — no contradictions between old and new content
9. Output the COMPLETE updated file, not just the diff`;
```

---

## FILE 2: validator.js — Il Quality Scoring System

```javascript
// ─── BLUEPRINT QUALITY VALIDATOR ───
// Analyzes generated output and scores it on 4 axes:
// Completeness (30%), Specificity (25%), Coherence (25%), Length (20%)

import { FILE_TYPES } from "../data/constants.js";

// ─── MAIN VALIDATOR ───
export function validateOutput(output, fileType, config) {
    if (!output || typeof output !== "string") {
        return { score: 0, issues: [{ category: "completeness", message: "Output is empty", severity: "critical" }], breakdown: { completeness: 0, specificity: 0, coherence: 0, length: 0 } };
    }

    const fileMeta = FILE_TYPES.find(f => f.id === fileType);
    const issues = [];

    // ─── Completeness (30%) ───
    const completenessScore = checkCompleteness(output, fileMeta, issues);

    // ─── Specificity (25%) ───
    const specificityScore = checkSpecificity(output, issues);

    // ─── Coherence (25%) ───
    const coherenceScore = checkCoherence(output, config, issues);

    // ─── Length (20%) ───
    const lengthScore = checkLength(output, fileMeta, issues);

    const score = Math.round(
        completenessScore * 0.30 +
        specificityScore * 0.25 +
        coherenceScore * 0.25 +
        lengthScore * 0.20
    );

    return {
        score,
        grade: score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F",
        issues,
        breakdown: {
            completeness: completenessScore,
            specificity: specificityScore,
            coherence: coherenceScore,
            length: lengthScore,
        },
    };
}

// Completeness: counts headings vs expected sections
function checkCompleteness(output, fileMeta, issues) {
    if (!fileMeta) return 70;
    const headings = (output.match(/^#{1,3}\s+.+$/gm) || []);
    const headingCount = headings.length;
    const expected = fileMeta.expectedSections || 5;
    if (headingCount === 0) {
        issues.push({ category: "completeness", message: "No section headings found.", severity: "critical" });
        return 10;
    }
    if (headingCount < expected * 0.5) return 40;
    if (headingCount < expected) return 70;
    return 100;
}

// Specificity: detects placeholders + generic phrasing
function checkSpecificity(output, issues) {
    let score = 100;
    const placeholders = [
        /\[TODO\]/gi, /\[INSERT\]/gi, /\[YOUR[_ ]/gi,
        /\[CUSTOMIZE\]/gi, /\[PLACEHOLDER\]/gi, /\[CHANGE[_ ]THIS\]/gi,
        /\.\.\.\s*$/gm, /etc\.?\s*$/gm,
    ];
    for (const ph of placeholders) {
        const matches = output.match(ph);
        if (matches) score -= 15 * matches.length;
    }
    const genericPhrases = [
        /your (project|application|app) name/gi,
        /replace with your/gi,
        /add your (own|custom)/gi,
    ];
    for (const gp of genericPhrases) {
        if (gp.test(output)) score -= 10;
    }
    return Math.max(0, score);
}

// Coherence: checks if stack technologies are mentioned
function checkCoherence(output, config, issues) {
    if (!config || !config.stack) return 70;
    let score = 100;
    const stackValues = Object.values(config.stack).filter(Boolean);
    if (stackValues.length === 0) return 70;
    let mentioned = 0;
    for (const tech of stackValues) {
        if (typeof tech === "string" && tech.length > 2) {
            const techName = tech.split(" ")[0];
            if (output.toLowerCase().includes(techName.toLowerCase())) mentioned++;
        }
    }
    const mentionRate = mentioned / stackValues.length;
    if (mentionRate < 0.3) score = 30;
    else if (mentionRate < 0.6) score = 60;
    else if (mentionRate < 0.8) score = 85;
    return Math.max(0, score);
}

// Length: checks line count vs expected range
function checkLength(output, fileMeta, issues) {
    const lines = output.split("\n").length;
    if (!fileMeta || !fileMeta.lines) return lines > 50 ? 100 : lines > 20 ? 60 : 20;
    const [minStr, maxStr] = fileMeta.lines.split("-");
    const min = parseInt(minStr) || 100;
    const max = parseInt(maxStr) || 500;
    if (lines < min * 0.3) return 10;
    if (lines < min * 0.6) return 40;
    if (lines < min) return 70;
    if (lines > max * 1.5) return 85;
    return 100;
}
```

---

## Contesto Aggiuntivo

- **Flusso**: System Prompt (META_TEMPLATE + RIGOR + IDE_ADAPTER) + User Prompt (buildPrompt) → LLM → Validate → se score < 75 → Refine → ri-valida
- **5 file types generati**: rules.md, skills, workflows, context, prompt_start
- **4 IDE target**: Antigravity, Cursor, GitHub Copilot, Windsurf
- **6 domini**: SaaS B2B, WordPress, E-commerce, Mobile, Data, Custom
- **3 livelli rigor**: strict, balanced, rapid
- **Il tool è live**: blueprint-compiler.vercel.app

## Formato risposta atteso

Per ogni problema trovato:
```
### [Numero] Titolo del problema
- **Dove**: [citazione esatta dal codice]
- **Impatto**: [cosa succede nell'output generato]
- **Fix proposto**: [soluzione concreta con esempio]
- **Priorità**: 🔴 Alta / 🟡 Media / 🟢 Bassa
```
