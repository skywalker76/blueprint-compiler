// ─── LANGUAGES ───
export const LANGUAGES = [
    { code: "it", label: "🇮🇹 Italiano" },
    { code: "en", label: "🇬🇧 English" },
    { code: "es", label: "🇪🇸 Español" },
    { code: "de", label: "🇩🇪 Deutsch" },
    { code: "fr", label: "🇫🇷 Français" },
    { code: "pt", label: "🇧🇷 Português" },
];

// ─── FILE TYPES (Blueprint output files) ───
export const FILE_TYPES = [
    { id: "rules", label: "rules.md", layer: "Layer 2", desc: "Workspace Rules — the core of your Blueprint. Defines identity, stack, architecture, conventions, and security.", lines: "400-500", expectedSections: 13 },
    { id: "skills", label: "Skills", layer: "Layer 3", desc: "Modular competencies loaded on-demand. Each skill teaches the agent HOW to do a specific task with templates and constraints.", lines: "500-700", expectedSections: 5 },
    { id: "workflows", label: "Workflows", layer: "Layer 4", desc: "Step-by-step procedures that enforce correct order of operations. The agent follows these like a checklist.", lines: "200-300", expectedSections: 2 },
    { id: "context", label: "Context", layer: "Layer 5", desc: "Architecture Decision Records documenting WHY each tech was chosen, plus coding style conventions.", lines: "300-400", expectedSections: 5 },
    { id: "prompt", label: "PROMPT_START", layer: "Entry", desc: "The bootstrap file — project overview, file tree, quick start commands.", lines: "60-80", expectedSections: 3 },
];

// ─── IDE TARGETS (Multi-IDE support) ───
export const IDE_TARGETS = [
    {
        id: "antigravity",
        name: "Google Antigravity",
        icon: "🚀",
        shortDesc: "Google's agentic IDE with Skills & Workflows system",
        rulesPath: ".antigravity/rules.md",
        skillsPath: ".agent/skills/",
        workflowsPath: ".agent/workflows/",
        contextPath: ".context/",
        promptPath: "PROMPT_START.md",
        guide: "Antigravity uses a layered context system: GEMINI.md (global) + rules.md (project) + Skills (on-demand) + Workflows (procedures). THE native target for Blueprint Compiler.",
        configFormat: "markdown",
    },
    {
        id: "cursor",
        name: "Cursor",
        icon: "⚡",
        shortDesc: "AI-native code editor with .cursorrules",
        rulesPath: ".cursor/rules/blueprint.mdc",
        skillsPath: ".cursor/rules/skills/",
        workflowsPath: ".cursor/rules/workflows/",
        contextPath: ".context/",
        promptPath: ".cursor/rules/overview.mdc",
        guide: "Cursor uses .mdc files in .cursor/rules/ for project-specific instructions. Rules are loaded automatically based on file globs and descriptions. Max ~2000 tokens per rule file recommended.",
        configFormat: "mdc",
    },
    {
        id: "copilot",
        name: "GitHub Copilot",
        icon: "🤖",
        shortDesc: "GitHub's AI pair programmer with custom instructions",
        rulesPath: ".github/copilot-instructions.md",
        skillsPath: ".github/copilot/skills/",
        workflowsPath: ".github/copilot/workflows/",
        contextPath: ".context/",
        promptPath: ".github/copilot/overview.md",
        guide: "Copilot reads .github/copilot-instructions.md for repository-level custom instructions. File is loaded automatically for all conversations. Keep concise — Copilot has a smaller context window.",
        configFormat: "markdown",
    },
    {
        id: "windsurf",
        name: "Windsurf",
        icon: "🌊",
        shortDesc: "Codeium's agentic IDE with Cascade flows",
        rulesPath: ".windsurfrules",
        skillsPath: ".windsurf/skills/",
        workflowsPath: ".windsurf/workflows/",
        contextPath: ".context/",
        promptPath: ".windsurf/overview.md",
        guide: "Windsurf uses .windsurfrules file at project root for workspace-level instructions. Cascade (agentic mode) reads these automatically. Supports markdown format.",
        configFormat: "markdown",
    },
];

// ─── TIER / PRICING ───
export const TIERS = {
    free: {
        name: "Free",
        maxGenerations: 3,
        maxSavedBlueprints: 3,
        ideTargets: ["antigravity"],
        hasScanner: false,
        hasRefinement: false,
        hasExportZip: false,
    },
    pro: {
        name: "Pro",
        price: "$9/mo",
        maxGenerations: Infinity,
        maxSavedBlueprints: Infinity,
        ideTargets: ["antigravity", "cursor", "copilot", "windsurf"],
        hasScanner: true,
        hasRefinement: true,
        hasExportZip: true,
    },
};

// ─── BLUEPRINT RIGOR LEVELS ───
export const RIGOR_LEVELS = [
    { id: "strict", label: "🏛️ Strict", name: "Enterprise / Production", desc: "Full planning, 90%+ test coverage, complete OWASP security. For production systems and regulated industries." },
    { id: "balanced", label: "⚖️ Balanced", name: "Recommended", desc: "Complexity-gated planning, 80%+ coverage, essential security. Best for most projects." },
    { id: "rapid", label: "🚀 Rapid", name: "Prototype / MVP", desc: "Minimal planning, critical-path testing only, ship fast. For hackathons and quick prototypes." },
];
