export const GALLERY_BLUEPRINTS = [
    {
        id: "gallery-saas-starter",
        config: {
            projectName: "saas-starter-kit",
            mission: "A comprehensive B2B SaaS boilerplate with authentication, multi-tenancy, and subscription billing. Includes role-based access control and dashboard layouts.",
            domain: "saas",
            stack: { frontend: "Next.js", backend: "Supabase", database: "Postgres", style: "Tailwind" },
            priorities: ["security", "scalability", "maintainability", "performance"],
            rigor: "balanced"
        },
        ideTarget: "cursor",
        createdAt: "2024-02-14T10:00:00Z",
        quality: { score: 92 },
        author: "Antigravity Team",
        isOfficial: true
    },
    {
        id: "gallery-chrome-extension",
        config: {
            projectName: "ai-research-assistant",
            mission: "Browser extension that analyzes page content and summarizes key points using local LLMs. Features side-panel UI and context menu integration.",
            domain: "extension",
            stack: { frontend: "React", backend: "Plasmo", style: "CSS Modules" },
            priorities: ["performance", "maintainability", "privacy", "security"],
            rigor: "strict"
        },
        ideTarget: "windsurf",
        createdAt: "2024-02-13T15:30:00Z",
        quality: { score: 88 },
        author: "Community",
        isOfficial: false
    },
    {
        id: "gallery-cli-tool",
        config: {
            projectName: "dev-ops-cli",
            mission: "Command-line interface for managing cloud infrastructure deployments. Supports AWS and improved error handling with colorized output.",
            domain: "cli",
            stack: { frontend: "Node.js", backend: "Commander.js", style: "Chalk" },
            priorities: ["maintainability", "performance", "usability", "security"],
            rigor: "rapid"
        },
        ideTarget: "antigravity",
        createdAt: "2024-02-12T09:15:00Z",
        quality: { score: 85 },
        author: "DevOpsPro",
        isOfficial: false
    }
];
