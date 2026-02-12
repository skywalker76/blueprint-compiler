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

// ─── COMPLETENESS CHECK ───
function checkCompleteness(output, fileMeta, issues) {
    if (!fileMeta) return 70;

    // Count markdown headings (## or ###)
    const headings = (output.match(/^#{1,3}\s+.+$/gm) || []);
    const headingCount = headings.length;
    const expected = fileMeta.expectedSections || 5;

    if (headingCount === 0) {
        issues.push({ category: "completeness", message: "No section headings found. Expected structured output with at least " + expected + " sections.", severity: "critical" });
        return 10;
    }

    if (headingCount < expected * 0.5) {
        issues.push({ category: "completeness", message: `Only ${headingCount} sections found, expected at least ${expected}. Missing sections reduce Blueprint usefulness.`, severity: "high" });
        return 40;
    }

    if (headingCount < expected) {
        issues.push({ category: "completeness", message: `${headingCount}/${expected} sections found. Consider adding more sections for completeness.`, severity: "medium" });
        return 70;
    }

    return 100;
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
    if (!config || !config.stack) return 70;

    let score = 100;
    const stackValues = Object.values(config.stack).filter(Boolean);

    if (stackValues.length === 0) return 70;

    // Check that at least some stack technologies are mentioned
    let mentioned = 0;
    for (const tech of stackValues) {
        if (typeof tech === "string" && tech.length > 2) {
            // Check for the technology name (case-insensitive)
            const techName = tech.split(" ")[0]; // "Next.js 15" → "Next.js"
            if (output.toLowerCase().includes(techName.toLowerCase())) {
                mentioned++;
            }
        }
    }

    const mentionRate = mentioned / stackValues.length;

    if (mentionRate < 0.3) {
        issues.push({ category: "coherence", message: `Only ${mentioned}/${stackValues.length} configured stack technologies are mentioned in the output. Blueprint should reference the actual stack.`, severity: "high" });
        score = 30;
    } else if (mentionRate < 0.6) {
        issues.push({ category: "coherence", message: `${mentioned}/${stackValues.length} stack technologies mentioned. Some configured tools are not referenced.`, severity: "medium" });
        score = 60;
    } else if (mentionRate < 0.8) {
        score = 85;
    }

    // Check project name is mentioned
    if (config.projectName && config.projectName.length > 2) {
        if (!output.toLowerCase().includes(config.projectName.toLowerCase())) {
            issues.push({ category: "coherence", message: `Project name "${config.projectName}" is not mentioned in the output.`, severity: "medium" });
            score -= 10;
        }
    }

    return Math.max(0, score);
}

// ─── LENGTH CHECK ───
function checkLength(output, fileMeta, issues) {
    const lines = output.split("\n").length;

    if (!fileMeta || !fileMeta.lines) {
        return lines > 50 ? 100 : lines > 20 ? 60 : 20;
    }

    const [minStr, maxStr] = fileMeta.lines.split("-");
    const min = parseInt(minStr) || 100;
    const max = parseInt(maxStr) || 500;

    if (lines < min * 0.3) {
        issues.push({ category: "length", message: `Output is only ${lines} lines. Expected ${fileMeta.lines} lines. Critically short.`, severity: "critical" });
        return 10;
    }

    if (lines < min * 0.6) {
        issues.push({ category: "length", message: `Output is ${lines} lines, expected at least ${min}. Several sections may be incomplete.`, severity: "high" });
        return 40;
    }

    if (lines < min) {
        issues.push({ category: "length", message: `Output is ${lines} lines, slightly below minimum of ${min}.`, severity: "medium" });
        return 70;
    }

    if (lines > max * 1.5) {
        issues.push({ category: "length", message: `Output is ${lines} lines, significantly over the expected ${max} maximum. May include unnecessary content.`, severity: "low" });
        return 85;
    }

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
