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
    const completenessScore = checkCompleteness(output, fileMeta, config, issues);

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

// ─── COMPLETENESS CHECK (Semantic) ───
function checkCompleteness(output, fileMeta, config, issues) {
    if (!fileMeta) return 70;
    let score = 100;
    const lowerOut = output.toLowerCase();

    // 1. Core Semantic Concepts (required per file type)
    const coreSemantics = {
        "rules": ["security", "architecture", "test", "convention", "quality"],
        "skills": ["trigger", "step", "validation"],
        "workflows": ["step", "verify", "rollback"],
    };

    const required = coreSemantics[fileMeta.id] || [];
    const missingCore = required.filter(concept => !lowerOut.includes(concept));

    if (missingCore.length > 0) {
        issues.push({ category: "completeness", message: `Missing fundamental technical concepts: ${missingCore.map(c => c.toUpperCase()).join(", ")}`, severity: "high" });
        score -= (missingCore.length * 15);
    }

    // 2. Domain Verification (e.g. SaaS requires auth/RBAC/tenant)
    const domainKws = {
        "SaaS B2B": ["tenant", "rbac", "auth", "subscription", "role"],
        "E-commerce": ["cart", "checkout", "payment", "inventory"],
        "Data": ["pipeline", "etl", "throughput", "batch", "memory"],
    };

    const expectedDomainKws = domainKws[config?.domain] || [];
    if (expectedDomainKws.length > 0 && !expectedDomainKws.some(kw => lowerOut.includes(kw))) {
        issues.push({ category: "completeness", message: `Output lacks specific architecture concepts for domain: ${config.domain}`, severity: "medium" });
        score -= 15;
    }

    // 3. Heading structure (secondary check — still useful)
    const headings = (output.match(/^#{1,3}\s+.+$/gm) || []);
    const expected = fileMeta.expectedSections || 5;

    if (headings.length === 0) {
        issues.push({ category: "completeness", message: `No section headings found. Expected structured output with at least ${expected} sections.`, severity: "critical" });
        score -= 40;
    } else if (headings.length < expected * 0.5) {
        issues.push({ category: "completeness", message: `Only ${headings.length} sections found, expected at least ${expected}.`, severity: "high" });
        score -= 20;
    }

    return Math.max(0, score);
}

// ─── SPECIFICITY CHECK ───
function checkSpecificity(output, issues) {
    let score = 100;
    const placeholders = [
        { pattern: /\[TODO\]/gi, label: "[TODO]" },
        { pattern: /\[INSERT\]/gi, label: "[INSERT]" },
        { pattern: /\[YOUR[_ ]/gi, label: "[YOUR...]" },
        { pattern: /\[CUSTOMIZE\]/gi, label: "[CUSTOMIZE]" },
        { pattern: /\[PLACEHOLDER\]/gi, label: "[PLACEHOLDER]" },
        { pattern: /\[CHANGE[_ ]THIS\]/gi, label: "[CHANGE THIS]" },
        { pattern: /\.\.\.\s*$/gm, label: "trailing ..." },
        { pattern: /etc\.?\s*$/gm, label: "trailing etc" },
    ];

    for (const ph of placeholders) {
        const matches = output.match(ph.pattern);
        if (matches && matches.length > 0) {
            issues.push({ category: "specificity", message: `Found ${matches.length}x ${ph.label} — output must be production-ready with no placeholders.`, severity: "high" });
            score -= 15 * matches.length;
        }
    }

    // Check for generic phrasing
    const genericPhrases = [
        /your (project|application|app) name/gi,
        /replace with your/gi,
        /add your (own|custom)/gi,
    ];

    for (const gp of genericPhrases) {
        if (gp.test(output)) {
            issues.push({ category: "specificity", message: `Generic phrasing detected: "${gp.source}". Output should reference actual project configuration.`, severity: "medium" });
            score -= 10;
        }
    }

    return Math.max(0, score);
}

// ─── COHERENCE CHECK ───
function checkCoherence(output, config, issues) {
    if (!config || !config.stack) return 100;

    let score = 100;
    const stackValues = Object.values(config.stack).filter(v => typeof v === "string" && v.length > 2);

    if (stackValues.length === 0) return 100;

    // Check that at least some stack technologies are mentioned
    let mentioned = 0;
    const lowerOut = output.toLowerCase();

    for (const tech of stackValues) {
        // Strip version numbers and get the first main word (e.g., "Next.js" -> "next", "React Native" -> "react")
        const cleanTech = tech.replace(/\sv?\d+(\.\d+)*[a-z]*$/i, "").trim().toLowerCase();
        const firstWord = cleanTech.split(/[\s-]+/)[0];

        // Very forgiving match: just check if the main word is anywhere in the output
        if (firstWord.length > 2 && lowerOut.includes(firstWord)) {
            mentioned++;
        }
    }

    const mentionRate = mentioned / stackValues.length;

    // Don't penalize heavily, as not every file (e.g. workflows) needs to list all tools
    if (mentionRate < 0.3) {
        issues.push({ category: "coherence", message: `Only ${mentioned}/${stackValues.length} core stack technologies detected. (Note: standard for non-architectural files).`, severity: "low" });
        score -= 10;
    } else if (mentionRate < 0.6) {
        score -= 5;
    }

    // Check project name is mentioned
    if (config.projectName && config.projectName.length > 2) {
        if (!lowerOut.includes(config.projectName.toLowerCase())) {
            // Just a minor warning
            score -= 5;
        }
    }

    return Math.max(0, score);
}

// ─── LENGTH CHECK ───
// Only penalizes truly truncated files. Dense, short files are rewarded.
function checkLength(output, fileMeta, issues) {
    const lines = output.split("\n").length;

    if (lines < 40) {
        issues.push({ category: "length", message: `Output is only ${lines} lines. Appears truncated or critically incomplete.`, severity: "critical" });
        return 10;
    }

    if (lines < 80) {
        issues.push({ category: "length", message: `Output is ${lines} lines. May be missing important sections.`, severity: "high" });
        return 50;
    }

    // Dense, high-quality short files are fine — no penalty for conciseness
    return 100;
}

// ─── OVERALL GRADE LABEL ───
export function getGradeLabel(grade) {
    const labels = {
        A: "Excellent — Production ready",
        B: "Good — Minor improvements possible",
        C: "Acceptable — Some gaps to address",
        D: "Below standard — Significant issues",
        F: "Failed — Regeneration required",
    };
    return labels[grade] || "Unknown";
}
