// ─── PROJECT SCANNER ───
// Parses package.json to auto-detect stack technologies

// ─── DETECTION RULES ───
const DETECTION_RULES = {
    framework: [
        { match: ["next"], value: "Next.js 15", confidence: 95 },
        { match: ["nuxt"], value: "Nuxt 3", confidence: 95 },
        { match: ["svelte", "@sveltejs/kit"], value: "SvelteKit", confidence: 95 },
        { match: ["@remix-run/react"], value: "Remix", confidence: 95 },
        { match: ["react-native", "expo"], value: "React Native (Expo)", confidence: 90 },
        { match: ["flutter"], value: "Flutter", confidence: 80 },
    ],
    api: [
        { match: ["@trpc/server", "@trpc/client"], value: "tRPC", confidence: 95 },
        { match: ["@apollo/server", "apollo-server"], value: "GraphQL (Apollo)", confidence: 90 },
        { match: ["express"], value: "REST (Express)", confidence: 70 },
        { match: ["hono"], value: "Hono", confidence: 90 },
    ],
    orm: [
        { match: ["drizzle-orm"], value: "Drizzle + PostgreSQL", confidence: 90 },
        { match: ["prisma", "@prisma/client"], value: "Prisma + PostgreSQL", confidence: 90 },
        { match: ["typeorm"], value: "TypeORM + PostgreSQL", confidence: 85 },
        { match: ["mongoose"], value: "Mongoose + MongoDB", confidence: 90 },
    ],
    auth: [
        { match: ["next-auth", "@auth/core"], value: "NextAuth.js", confidence: 90 },
        { match: ["@clerk/nextjs", "@clerk/clerk-react"], value: "Clerk", confidence: 95 },
        { match: ["auth0", "@auth0/nextjs-auth0"], value: "Auth0", confidence: 90 },
        { match: ["@supabase/auth-helpers", "@supabase/ssr"], value: "Supabase Auth", confidence: 85 },
    ],
    billing: [
        { match: ["stripe", "@stripe/stripe-js"], value: "Stripe", confidence: 90 },
        { match: ["@paddle/paddle-js"], value: "Paddle", confidence: 90 },
        { match: ["@lemonsqueezy/lemonsqueezy.js"], value: "LemonSqueezy", confidence: 90 },
    ],
    hosting: [
        { match: ["@vercel/analytics", "vercel"], value: "Vercel", confidence: 70 },
    ],
    // WordPress-specific
    wpversion: [
        { match: ["@wordpress/scripts"], value: "WordPress 6.7+", confidence: 80 },
    ],
    builder: [
        { match: ["@wordpress/blocks", "@wordpress/block-editor"], value: "Gutenberg (Block Editor)", confidence: 90 },
    ],
    // E-commerce-specific
    platform: [
        { match: ["@shopify/hydrogen", "@shopify/cli"], value: "Shopify + Hydrogen", confidence: 95 },
        { match: ["@medusajs/medusa"], value: "Medusa.js", confidence: 95 },
    ],
    search: [
        { match: ["algoliasearch", "@algolia/client-search"], value: "Algolia", confidence: 90 },
        { match: ["meilisearch"], value: "Meilisearch", confidence: 90 },
        { match: ["typesense"], value: "Typesense", confidence: 90 },
    ],
    // Mobile-specific
    state: [
        { match: ["zustand"], value: "Zustand", confidence: 90 },
        { match: ["@reduxjs/toolkit"], value: "Redux Toolkit", confidence: 90 },
        { match: ["mobx"], value: "MobX", confidence: 85 },
    ],
    backend: [
        { match: ["@supabase/supabase-js"], value: "Supabase", confidence: 85 },
        { match: ["firebase", "firebase-admin"], value: "Firebase", confidence: 85 },
    ],
    navigation: [
        { match: ["@react-navigation/native"], value: "React Navigation", confidence: 95 },
        { match: ["expo-router"], value: "Expo Router", confidence: 95 },
    ],
    // Data-specific
    orchestrator: [
        { match: ["apache-airflow"], value: "Apache Airflow", confidence: 80 },
        { match: ["n8n"], value: "n8n", confidence: 80 },
    ],
};

// ─── DOMAIN DETECTION ───
const DOMAIN_SIGNALS = [
    { domain: "wordpress", deps: ["@wordpress/scripts", "@wordpress/blocks", "@wordpress/block-editor"] },
    { domain: "ecommerce", deps: ["@shopify/hydrogen", "@medusajs/medusa", "saleor", "woocommerce"] },
    { domain: "mobile", deps: ["react-native", "expo", "flutter", "@react-navigation/native"] },
    { domain: "data", deps: ["apache-airflow", "dbt", "apache-kafka"] },
    { domain: "saas", deps: ["next", "nuxt", "@trpc/server", "stripe", "next-auth", "@clerk/nextjs"] },
];

// ─── MAIN SCANNER ───
export function scanPackageJson(jsonString) {
    let pkg;
    try {
        pkg = JSON.parse(jsonString);
    } catch (e) {
        return { success: false, error: "Invalid JSON. Please paste a valid package.json file.", detected: {}, domain: null };
    }

    const allDeps = {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {}),
        ...(pkg.peerDependencies || {}),
    };
    const depNames = Object.keys(allDeps);

    if (depNames.length === 0) {
        return { success: false, error: "No dependencies found in package.json.", detected: {}, domain: null };
    }

    // Detect technologies
    const detected = {};

    for (const [category, rules] of Object.entries(DETECTION_RULES)) {
        for (const rule of rules) {
            const found = rule.match.some(m => depNames.includes(m));
            if (found && !detected[category]) {
                detected[category] = {
                    value: rule.value,
                    confidence: rule.confidence,
                    matchedDeps: rule.match.filter(m => depNames.includes(m)),
                };
            }
        }
    }

    // Detect domain
    let detectedDomain = null;
    let maxScore = 0;

    for (const signal of DOMAIN_SIGNALS) {
        const score = signal.deps.filter(d => depNames.includes(d)).length;
        if (score > maxScore) {
            maxScore = score;
            detectedDomain = signal.domain;
        }
    }

    // Extract project name
    const projectName = pkg.name || null;
    const description = pkg.description || null;

    return {
        success: true,
        projectName,
        description,
        domain: detectedDomain,
        detected,
        totalDeps: depNames.length,
        summary: Object.entries(detected)
            .map(([cat, det]) => `${cat}: ${det.value} (${det.confidence}% confidence)`)
            .join(", "),
    };
}
