// ─── AGENTIC GENERATION ENGINE ───
// Multi-step: Generate → Validate → Refine
import { IDE_TARGETS, FILE_TYPES } from "../data/constants.js";
import { validateOutput } from "./validator.js";
import { getProvider } from "./providers/index.js";
import { SKILL_REGISTRY } from "../data/skillRegistry.js";

// ─── META-TEMPLATE SYSTEM PROMPT ───
const META_TEMPLATE_SYSTEM = `You are a Context Engineering Blueprint Compiler. You generate production-ready Blueprint files for AI coding agents.

## 7 FUNDAMENTAL PRINCIPLES
1. Enforcement > Guidelines — every rule must have a technical enforcement mechanism
2. Progressive Disclosure — load context only when needed (skills on-demand, not always)
3. Adaptive Governance — Execution vs Planning strictness is dictated entirely by the project's Rigor Level. Follow the specific Plan Mode Contract provided in the RIGOR section below
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
11. Performance Metrics (Domain-adaptive: Web=LCP/Bundle size; Backend/API=Latency p95/Throughput; Mobile=Startup time/Memory; Data=Pipeline duration/Memory limit)
12. Error Handling (logging format, error codes, retry policies)
13. Ergonomics & UI/API Experience (Domain-adaptive: Web=WCAG accessibility; API=Contract strictness & Error standardization; CLI=stdout formatting; Mobile=Platform HIG compliance)

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
- Write ALL configuration files strictly in English. NO conversational wrapper
- Use the project's Programming Language for code snippets and the Naming Language for variables/commits
- Conversation with user in their specified conversation language
- Generate complete, production-ready files — no placeholders like [TODO] or [INSERT]
- Every code snippet must be valid for the chosen stack
- Be opinionated — make concrete technology choices, not generic suggestions
- Include line counts and file paths in your output
- Optimize for context window efficiency: compress without losing precision

## TONE & DENSITY CALIBRATION (MICRO-SHOT)
Adopt this EXACT imperative, high-density tone. DO NOT use conversational filler.

🔴 ANTI-PATTERN (Chatty, Generic, Weak):
"For testing, you should probably use Jest because it's standard. Try to write good tests for your components and make sure to mock the database."

🟢 PRO-PATTERN (Dense, Agentic, Enforceable):
"### 10. Testing Requirements [CORE]
- **Framework**: \`Vitest\` + \`React Testing Library\`.
- **Rule**: 80% minimum global coverage. CI will fail < 80%.
- **Pattern**: AAA (Arrange, Act, Assert).
- **Mocks**: Use MSW for network APIs. NEVER mock Prisma client (use test DB schema)."`;

// ─── RIGOR LEVEL MODIFIERS ───
const RIGOR_MODIFIERS = {
    strict: `\n\n## RIGOR: STRICT (Enterprise/Production)
- Plan Mode: ALWAYS required for ALL changes, including trivial ones
- Complexity gating: ALL tasks require a written plan before execution, no exceptions
- Testing: 90%+ coverage mandatory, no exceptions
- Security: full OWASP checklist, CSP headers, rate limiting
- Code review: required before merge
- Zero tolerance for shortcuts`,
    balanced: `\n\n## RIGOR: BALANCED (Recommended)
- Plan Mode: complexity-gated:
  - Complexity 1-2 (typos, CSS, small utils): execute immediately, no plan required
  - Complexity 3-5 (new features, DB schema, auth, architecture): STOP, generate plan, wait for approval
- Testing: 80%+ coverage, critical paths mandatory
- Security: essential checklist (auth, input validation, CSRF)
- Pragmatic trade-offs allowed with documented rationale`,
    rapid: `\n\n## RIGOR: RAPID (Prototype/MVP)
- Plan Mode: only for architectural decisions (Complexity 4-5)
  - Complexity 1-3: execute immediately without planning
  - Complexity 4-5: brief plan required
- Testing: critical paths only, integration over unit
- Security: authentication + input validation minimum
- Speed over perfection — ship fast, refactor later
- Technical debt tracking required (use @TECHDEBT or FIXME-TICKET tags, NEVER use standard [TODO] placeholders)`,
};

// ─── IDE-SPECIFIC PROMPT ADAPTERS ───
const IDE_ADAPTERS = {
    antigravity: (basePrompt) => basePrompt + `\n\n## IDE: ANTIGRAVITY
- Target: Native multi-agent framework.
- Structure: Output Rules to \`.antigravity/rules.md\`, Skills to \`.agent/skills/\`.
- Differentiate clearly between 'Plan Mode' and 'Execute Mode' triggers using state markers.`,
    cursor: (basePrompt) => basePrompt + `\n\n## IDE: CURSOR (.mdc FORMAT REQUIRED)
- **Format:** Output MUST be a strictly valid Cursor Markdown Rule (\`.mdc\` extension).
- **Frontmatter:** You MUST start the file with EXACTLY this YAML frontmatter:
  ---
  description: "Actionable description of the rule (max 10 words)"
  globs: ["src/**/*.ts", "src/**/*.tsx"] # Specify relevant extensions
  alwaysApply: false # True only for global workspace rules
  ---
- **Parsing:** Cursor Claude/GPT models degrade past 2000 tokens. Use <rule>, <example>, and <critical> XML tags to help the parser. Break large rules into chunked lists.`,
    copilot: (basePrompt) => basePrompt + `\n\n## IDE: GITHUB COPILOT
- **Format:** Output as a single, extremely dense \`.github/copilot-instructions.md\`.
- **Constraint:** Copilot has a tiny context window for custom instructions (~500 lines). EXTREME COMPRESSION REQUIRED.
- **Focus:** Omit complex autonomous agent workflows. Strictly enforce Naming conventions, Test boundaries, and Code Quality. Copilot is an autocomplete engine, not an autonomous agent.`,
    windsurf: (basePrompt) => basePrompt + `\n\n## IDE: WINDSURF (CASCADE AGENT)
- **Format:** Output as \`.windsurfrules\` file at project root.
- **Agent Awareness:** Address the 'Cascade' agent directly.
- **Workflow:** Define exact triggers for when Cascade must STOP and wait for user approval. Explicitly authorize which terminal commands Cascade can run autonomously (e.g., "Cascade may run \`npm run lint\` automatically").`,
};

// ─── REFINEMENT PROMPT ───
const REFINEMENT_PROMPT = `You previously generated a Blueprint file but the quality checker found these issues:

{ISSUES}

Please regenerate the file fixing ALL the issues listed above. The output must:
1. Contain all expected sections with proper headings
2. Reference the EXACT stack technologies configured (not generic ones)
3. Have NO placeholder text like [TODO], [INSERT], [YOUR], or [CUSTOMIZE]
4. Maximize technical density. Ensure EVERY required section is thoroughly defined. Do NOT use generic filler to pad length
5. Be complete and production-ready`;

// ─── SECTION SKELETONS ───
const SECTION_SKELETONS = {
    "rules": `\n## MANDATORY OUTPUT SKELETON
You MUST structure your output using EXACTLY these headings in this order. Do not rename or skip them:
# Workspace Rules & Identity
## 1. Role & Plan Mode Contract
## 2. Architecture & Stack [STACK]
## 3. Code Quality & Typing [CORE]
## 4. Security Posture [CORE]
## 5. Testing & Validation
## 6. File Conventions
## 7. Domain Metrics`,

    "skills": `\n## MANDATORY OUTPUT SKELETON
You MUST structure your output using exactly this format:
1. First, evaluate the stack and return a JSON block selecting up to 4 official skills from the SKILL_REGISTRY provided below.
2. Underneath, write any remaining CUSTOM skills that are required by the stack but NOT available in the registry.

\`\`\`json
{
  "selected_registry_skills": ["id-1", "id-2"] // ONLY use IDs from the provided registry
}
\`\`\`

For any CUSTOM skills required (do not rewrite official ones), use exactly this format:
---
name: [Custom Skill Name]
description: [Actionable description]
---
# Trigger (When to activate)
# Context Required
# Execution Steps
# Validation Criteria`,
};

// ─── BUILD PROMPT ───
export function buildPrompt(fileType, config, ideTarget) {
    const ide = IDE_TARGETS.find(t => t.id === ideTarget) || IDE_TARGETS[0];
    const fileMeta = FILE_TYPES.find(f => f.id === fileType);

    const stackSummary = Object.entries(config.stack || {})
        .map(([k, v]) => `- ${k}: ${v}`)
        .join("\n");

    const priorities = (config.priorities || []).join(", ");
    const rigor = config.rigor || "balanced";
    const skeleton = SECTION_SKELETONS[fileMeta?.id] || "";

    let prompt = `Generate the **${fileMeta?.label || fileType}** file (${fileMeta?.layer || ""}) for this project:

## Project Configuration
- **Project Name:** ${config.projectName || "Untitled"}
- **Domain:** ${config.domain || "custom"}
- **Mission:** ${config.mission || "No mission defined"}
- **Conversation Language:** ${config.conversationLang || "English"}
- **Programming Language:** ${config.stack?.language || "Infer from Stack"}
- **Naming & Documentation Language:** ${config.codeLang || "English"}
- **Architecture Priorities:** ${priorities || "Not specified"}
- **Blueprint Rigor:** ${rigor.toUpperCase()}
- **Project Topology:** ${config.topology || "Standard Single-App"}
${config.customDomain ? `- **Custom Domain Description:** ${config.customDomain}` : ""}

## 🔒 STRICT STACK CONTRACT (ANTI-HALLUCINATION)
You are generating ONE file in a multi-file system. To ensure cross-file coherence:
1. You are BOUND to this exact stack:
${stackSummary || "Native language defaults"}
2. You are STRICTLY FORBIDDEN from suggesting, hallucinating, or writing snippets for ANY third-party library, framework, or tool not explicitly listed above.
3. If a category (like Testing) is missing from the stack, dictate the standard NATIVE tool for the primary language.

## Target IDE: ${ide.name}
- Rules path: ${ide.rulesPath}
- Skills path: ${ide.skillsPath}
- Workflows path: ${ide.workflowsPath}
- Context path: ${ide.contextPath}
- Config format: ${ide.configFormat}
${skeleton}

${fileType === 'skills' ? `## 📚 OFFICIAL SKILL REGISTRY\nYou must select applicable skills from this registry instead of writing them from scratch. Only write a custom skill if a crucial stack requirement is completely missing from this list:\n\`\`\`json\n${JSON.stringify(SKILL_REGISTRY, null, 2)}\n\`\`\`` : ""}

## DENSITY & OPTIMIZATION CONSTRAINT
**Target Density: Maximum.**
Every single sentence MUST dictate a concrete technical behavior, a configuration value, or a strict constraint.
DO NOT use conversational filler, pleasantries, or explanatory prose.
Do NOT artificially pad the output. Short, hyper-dense, and highly actionable is vastly superior to long and generic.
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
            .replace("{ISSUES}", issuesList);

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

// ─── UPDATE SINGLE FILE ───
export async function updateFile(fileType, apiKey, config, ideTarget, existingContent, changeDescription, onProgress, providerId, modelId) {
    const provider = getProvider(providerId);
    const ide = IDE_TARGETS.find(t => t.id === ideTarget) || IDE_TARGETS[0];
    const rigor = config.rigor || "balanced";
    const baseSystem = IDE_ADAPTERS[ide.id]?.(UPDATE_SYSTEM_PROMPT) || UPDATE_SYSTEM_PROMPT;
    const systemPrompt = baseSystem + (RIGOR_MODIFIERS[rigor] || RIGOR_MODIFIERS.balanced);

    const fileMeta = FILE_TYPES.find(f => f.id === fileType);
    const userPrompt = `## Update Request

**File type:** ${fileMeta?.label || fileType} (${fileMeta?.layer || ""})
**Project:** ${config.projectName || "Untitled"}
**Domain:** ${config.domain || "custom"}
**Target IDE:** ${ide.name}

### What Changed
${changeDescription}

### Existing Blueprint File (update this)
\`\`\`
${existingContent}
\`\`\`

Generate the COMPLETE updated ${fileMeta?.label || fileType} file. Preserve everything that's still valid. Update only what's affected by the changes described above.
Expected length: ${fileMeta?.lines || "200-400"} lines minimum.`;

    // Step 1: Update
    onProgress?.({ phase: "updating", fileType, step: 1, total: 2 });
    const updatedOutput = await provider.call(apiKey, systemPrompt, userPrompt, modelId);

    // Step 2: Validate
    onProgress?.({ phase: "validating", fileType, step: 1.5, total: 2 });
    const report = validateOutput(updatedOutput, fileType, config);

    // Step 3: Refine if quality < 75
    if (report.score < 75) {
        onProgress?.({ phase: "refining", fileType, step: 2, total: 2 });
        const issuesList = report.issues.map(i => `- [${i.category}] ${i.message}`).join("\n");
        const refinePrompt = REFINEMENT_PROMPT
            .replace("{ISSUES}", issuesList);

        const refinedOutput = await provider.call(apiKey, systemPrompt, userPrompt + "\n\n" + refinePrompt, modelId);
        const refinedReport = validateOutput(refinedOutput, fileType, config);

        return { output: refinedOutput, quality: refinedReport, refined: true, updated: true };
    }

    return { output: updatedOutput, quality: report, refined: false, updated: true };
}
