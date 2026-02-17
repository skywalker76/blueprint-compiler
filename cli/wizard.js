// ─── CLI INTERACTIVE WIZARD ───
// Zero-dependency interactive prompts using Node.js readline

import * as readline from "readline";
import { PROVIDER_LIST, getProvider } from "../src/engine/providers/index.js";
import { DOMAINS } from "../src/data/domains.js";
import { IDE_TARGETS } from "../src/data/constants.js";

// ─── READLINE HELPERS ───
function createInterface() {
    return readline.createInterface({ input: process.stdin, output: process.stdout });
}

function ask(rl, question) {
    return new Promise(resolve => rl.question(question, resolve));
}

async function askChoice(rl, question, options) {
    console.log(`\n${question}`);
    options.forEach((opt, i) => {
        console.log(`  ${i + 1}) ${opt.label}`);
    });
    while (true) {
        const answer = await ask(rl, `\n  → Choose (1-${options.length}): `);
        const idx = parseInt(answer) - 1;
        if (idx >= 0 && idx < options.length) return options[idx].value;
        console.log(`  ⚠ Please enter a number between 1 and ${options.length}`);
    }
}

async function askPassword(rl, question) {
    // Simple masked input - not truly hidden but good enough for CLI
    const answer = await ask(rl, question);
    return answer.trim();
}

// ─── COLORS ───
const C = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
    orange: "\x1b[38;5;208m",
    green: "\x1b[32m",
    cyan: "\x1b[36m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    gray: "\x1b[90m",
};

function banner() {
    console.log(`
${C.orange}${C.bold}  ⚡ Blueprint Compiler CLI v2.0${C.reset}
${C.dim}  ─────────────────────────────────${C.reset}
${C.gray}  Transform requirements into production-ready AI agent Blueprints${C.reset}
`);
}

// ─── MAIN WIZARD ───
export async function runWizard(scanResult = null) {
    const rl = createInterface();
    banner();

    try {
        // ── Step 1: Provider ──
        const providerId = await askChoice(rl, `${C.cyan}1/7${C.reset} Select LLM Provider:`,
            PROVIDER_LIST.map(p => ({ label: `${p.icon} ${p.name}`, value: p.id }))
        );
        const provider = getProvider(providerId);

        // ── Step 2: Model ──
        const modelId = await askChoice(rl, `${C.cyan}2/7${C.reset} Select Model:`,
            provider.models.map(m => ({ label: `${m.name} — ${m.description}`, value: m.id }))
        );

        // ── Step 3: API Key ──
        const apiKey = await askPassword(rl, `\n${C.cyan}3/7${C.reset} Enter your ${provider.name} API key: `);
        if (!apiKey) {
            console.log(`${C.red}  ✗ API key is required${C.reset}`);
            rl.close();
            return null;
        }
        if (!provider.validateKey(apiKey)) {
            console.log(`${C.yellow}  ⚠ Key format doesn't look like a valid ${provider.name} key, but continuing anyway...${C.reset}`);
        } else {
            console.log(`${C.green}  ✓ Key format valid${C.reset}`);
        }

        // ── Step 4: Domain ──
        let domain, customDomain = "";
        if (scanResult?.domain) {
            console.log(`\n${C.cyan}4/7${C.reset} Domain: ${C.green}Auto-detected → ${scanResult.domain}${C.reset}`);
            domain = scanResult.domain;
        } else {
            domain = await askChoice(rl, `${C.cyan}4/7${C.reset} Select Project Domain:`,
                DOMAINS.map(d => ({ label: `${d.icon} ${d.name} — ${d.shortDesc}`, value: d.id }))
            );
        }
        if (domain === "custom") {
            customDomain = await ask(rl, `\n  Describe your project domain: `);
        }

        // ── Step 5: Project Info ──
        const defaultName = scanResult?.projectName || "";
        const projectName = await ask(rl, `\n${C.cyan}5/7${C.reset} Project name${defaultName ? ` (${C.dim}${defaultName}${C.reset})` : ""}: `);
        const mission = await ask(rl, `  Project mission (one line): `);

        // ── Step 6: IDE Target ──
        const ideTarget = await askChoice(rl, `${C.cyan}6/7${C.reset} Select Target IDE:`,
            IDE_TARGETS.map(t => ({ label: `${t.icon} ${t.name} — ${t.shortDesc}`, value: t.id }))
        );

        // ── Step 7: Rigor ──
        const rigorOptions = [
            { label: "🏢 Strict — Enterprise/Production (90%+ coverage, full OWASP)", value: "strict" },
            { label: "⚖️ Balanced — Recommended (80%+ coverage, pragmatic)", value: "balanced" },
            { label: "🚀 Rapid — Prototype/MVP (speed over perfection)", value: "rapid" },
        ];
        const rigor = await askChoice(rl, `${C.cyan}7/7${C.reset} Blueprint Rigor Level:`, rigorOptions);

        // ── Build Config ──
        const config = {
            domain,
            projectName: projectName || defaultName || "my-project",
            mission: mission || "Not specified",
            langConvo: "en",
            langCode: "en",
            stack: scanResult?.detected
                ? Object.fromEntries(Object.entries(scanResult.detected).map(([k, v]) => [k, v.value]))
                : {},
            customDomain,
            customStack: "",
            priorities: ["performance", "security", "maintainability", "scalability"],
            rigor,
        };

        // ── Confirmation ──
        console.log(`\n${C.bold}${C.orange}  ═══ Configuration Summary ═══${C.reset}`);
        console.log(`  ${C.dim}Provider:${C.reset}  ${provider.icon} ${provider.name} (${provider.getModel(modelId).name})`);
        console.log(`  ${C.dim}Domain:${C.reset}    ${domain}`);
        console.log(`  ${C.dim}Project:${C.reset}   ${config.projectName}`);
        console.log(`  ${C.dim}Mission:${C.reset}   ${config.mission}`);
        console.log(`  ${C.dim}IDE:${C.reset}       ${IDE_TARGETS.find(t => t.id === ideTarget)?.name}`);
        console.log(`  ${C.dim}Rigor:${C.reset}     ${rigor}`);
        if (Object.keys(config.stack).length > 0) {
            console.log(`  ${C.dim}Stack:${C.reset}`);
            Object.entries(config.stack).forEach(([k, v]) => console.log(`    ${C.gray}${k}:${C.reset} ${v}`));
        }
        console.log();

        const confirm = await ask(rl, `  ${C.bold}Generate Blueprint? (Y/n):${C.reset} `);
        if (confirm.toLowerCase() === "n") {
            console.log(`\n${C.yellow}  Cancelled.${C.reset}\n`);
            rl.close();
            return null;
        }

        rl.close();
        return { apiKey, providerId, modelId, config, ideTarget };

    } catch (err) {
        rl.close();
        throw err;
    }
}
