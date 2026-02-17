#!/usr/bin/env node
// ─── BLUEPRINT COMPILER CLI ───
// npx blueprint-compiler init | scan | --help

import * as fs from "fs";
import * as path from "path";
import { runWizard } from "./wizard.js";
import { writeBlueprint } from "./writer.js";
import { generateFile } from "../src/engine/generator.js";
import { scanPackageJson } from "../src/engine/scanner.js";
import { FILE_TYPES } from "../src/data/constants.js";

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

// ─── HELP ───
function showHelp() {
    console.log(`
${C.orange}${C.bold}  ⚡ Blueprint Compiler CLI v2.0${C.reset}
${C.dim}  ─────────────────────────────────${C.reset}

${C.bold}  Usage:${C.reset}
    blueprint-compiler ${C.cyan}init${C.reset}     Interactive wizard → generate Blueprint
    blueprint-compiler ${C.cyan}scan${C.reset}     Auto-detect stack from package.json
    blueprint-compiler ${C.cyan}--help${C.reset}   Show this help
    blueprint-compiler ${C.cyan}--version${C.reset} Show version

${C.bold}  Examples:${C.reset}
    ${C.dim}# Generate a Blueprint for your project${C.reset}
    npx blueprint-compiler init

    ${C.dim}# Scan current project's stack${C.reset}
    npx blueprint-compiler scan

${C.bold}  Supported Providers:${C.reset}
    🟠 Anthropic (Claude Opus 4.6, Sonnet 4, Haiku 3.5)
    🟢 OpenAI (GPT-5.2, GPT-4o, GPT-4.1, o3-mini)
`);
}

// ─── SCAN COMMAND ───
async function commandScan() {
    const pkgPath = path.resolve("package.json");
    if (!fs.existsSync(pkgPath)) {
        console.log(`${C.red}  ✗ No package.json found in current directory${C.reset}`);
        console.log(`${C.dim}  Run this command from your project root.${C.reset}\n`);
        process.exit(1);
    }

    const content = fs.readFileSync(pkgPath, "utf-8");
    const result = scanPackageJson(content);

    if (!result.success) {
        console.log(`${C.red}  ✗ ${result.error}${C.reset}\n`);
        process.exit(1);
    }

    console.log(`\n${C.orange}${C.bold}  ⚡ Project Scan Results${C.reset}\n`);
    console.log(`  ${C.dim}Project:${C.reset}     ${result.projectName || "unnamed"}`);
    console.log(`  ${C.dim}Domain:${C.reset}      ${result.domain || "unknown"}`);
    console.log(`  ${C.dim}Total deps:${C.reset}  ${result.totalDeps}`);
    console.log(`\n  ${C.bold}Detected Stack:${C.reset}`);

    for (const [category, det] of Object.entries(result.detected)) {
        const confidence = det.confidence >= 90 ? C.green : det.confidence >= 70 ? C.yellow : C.red;
        console.log(`    ${C.dim}${category}:${C.reset} ${det.value} ${confidence}(${det.confidence}%)${C.reset}`);
    }

    if (Object.keys(result.detected).length === 0) {
        console.log(`    ${C.yellow}No known technologies detected${C.reset}`);
    }

    console.log(`\n  ${C.dim}Run 'blueprint-compiler init' to generate a full Blueprint.${C.reset}\n`);
    return result;
}

// ─── INIT COMMAND ───
async function commandInit() {
    // Auto-scan if package.json exists
    let scanResult = null;
    const pkgPath = path.resolve("package.json");
    if (fs.existsSync(pkgPath)) {
        console.log(`${C.dim}  📦 Found package.json — auto-detecting stack...${C.reset}`);
        const content = fs.readFileSync(pkgPath, "utf-8");
        scanResult = scanPackageJson(content);
        if (scanResult.success && Object.keys(scanResult.detected).length > 0) {
            console.log(`${C.green}  ✓ Detected: ${scanResult.summary}${C.reset}`);
        }
    }

    // Run wizard
    const wizardResult = await runWizard(scanResult);
    if (!wizardResult) {
        process.exit(0);
    }

    const { apiKey, providerId, modelId, config, ideTarget } = wizardResult;

    // Generate all files
    console.log(`\n${C.bold}${C.orange}  ═══ Generating Blueprint ═══${C.reset}\n`);

    const results = {};
    for (const ft of FILE_TYPES) {
        try {
            process.stdout.write(`  ${C.cyan}⟳${C.reset} Generating ${ft.label}...`);
            const result = await generateFile(ft.id, apiKey, config, ideTarget, (p) => {
                process.stdout.write(`\r  ${C.cyan}⟳${C.reset} ${ft.label}: ${p.phase}...     `);
            }, providerId, modelId);
            results[ft.id] = result;
            const score = result.quality?.score || 0;
            const grade = result.quality?.grade || "?";
            process.stdout.write(`\r  ${C.green}✓${C.reset} ${ft.label} ${C.dim}(score: ${score} ${grade})${C.reset}${result.refined ? ` ${C.cyan}[refined]${C.reset}` : ""}     \n`);
        } catch (err) {
            results[ft.id] = { output: "", error: err.message };
            process.stdout.write(`\r  ${C.red}✗${C.reset} ${ft.label}: ${err.message}     \n`);
        }
    }

    // Write files
    writeBlueprint(results, ideTarget);
}

// ─── MAIN ───
const args = process.argv.slice(2);
const command = args[0] || "init";

switch (command) {
    case "init":
        commandInit().catch(err => {
            console.error(`\n${C.red}  ✗ Error: ${err.message}${C.reset}\n`);
            process.exit(1);
        });
        break;
    case "scan":
        commandScan().catch(err => {
            console.error(`\n${C.red}  ✗ Error: ${err.message}${C.reset}\n`);
            process.exit(1);
        });
        break;
    case "--help":
    case "-h":
        showHelp();
        break;
    case "--version":
    case "-v":
        console.log("blueprint-compiler v2.0.0");
        break;
    default:
        console.log(`${C.red}  Unknown command: ${command}${C.reset}`);
        showHelp();
        process.exit(1);
}
