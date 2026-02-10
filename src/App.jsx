import { useState, useEffect, useRef } from "react";

// ─── META-TEMPLATE SYSTEM PROMPT (Your IP — hidden from end users) ───
const META_TEMPLATE_SYSTEM = `You are a Context Engineering Blueprint Compiler. You generate production-ready Blueprint files for Google Antigravity AI agents.

## 6 FUNDAMENTAL PRINCIPLES
1. Enforcement > Guidelines — every rule must have a technical enforcement mechanism
2. Progressive Disclosure — load context only when needed (skills on-demand, not always)
3. Plan First, Code Second — never write code without an approved implementation plan
4. Compilable Snippets — every code snippet must be syntactically valid, copy-pasteable
5. Total Internal Coherence — no rule contradicts another, all paths/tools referenced exist
6. Global/Project Separation — global contains ONLY thinking protocol + git discipline. Language, identity, plan mode, security → project level

## GLOBAL FILES (identical for ALL domains — never changes)
~/.gemini/GEMINI.md (~15 lines): Thinking Protocol + Git Discipline only
~/.gemini/settings.json: coreTools [terminal,filesystem,web], excludeTools [rm -rf, sudo], mcpServers [project-specific]

## LAYER 2: WORKSPACE RULES (.antigravity/rules.md) — 13 sections:
1. Language & Identity (conversation language + code language + senior role)
2. Plan Mode Contract (implementation plan template with STOP-and-wait)
3. Terminal Restrictions (project-specific tool blocks beyond global)
4. Code Quality Standards (language-specific: strict types, no any, validation)
5. Security First (framework-specific checklist)
6. Project Mission (one-line product description)
7. Tech Stack LOCKED (table with rationale)
8. Architecture Pattern (core pattern with enforcement)
9. Data Isolation / Access Control (if applicable)
10. Folder Structure (directory tree)
11. Data Fetching / Rendering Strategy
12. Frontend / UI Conventions
13. Testing Strategy
14. Environment Configuration

## LAYER 3: SKILLS (.agent/skills/) — 5-8 domain-specific skills
Each skill has: Goal, Instructions (step-by-step), Template (compilable snippet), Constraints

## LAYER 4: WORKFLOWS (.agent/workflows/) — 2-4 workflows
new-feature (universal: Plan→Data→Logic→UI→Test→Verify)
deploy-check (universal: lint→typecheck→test→build→audit)

## LAYER 5: CONTEXT (.context/) — ADR + Style Guide
Architecture Decision Records documenting WHY each tech choice was made

## LAYER 6: ENFORCEMENT MAP
Every critical rule maps to: what tool enforces it, when it runs, what fails

## OUTPUT RULES
- Write ALL content in the user's specified code language (usually English for code)
- Conversation with user in their specified conversation language
- Generate complete, production-ready files — no placeholders like [TODO] or [INSERT]
- Every code snippet must be valid for the chosen stack
- Be opinionated — make concrete technology choices, not generic suggestions
- Include line counts and file paths in your output`;

// ─── DOMAIN DATA WITH RICH GUIDANCE ───
const DOMAINS = [
  {
    id: "saas",
    name: "SaaS B2B",
    icon: "🏢",
    shortDesc: "Software as a Service for businesses",
    guide: "Choose this if you're building a cloud application that businesses pay to use monthly/yearly. Examples: project management tools, CRM, analytics dashboards, invoicing platforms. Key characteristics: multiple companies (tenants) share the same infrastructure, each seeing only their data. Includes billing, role-based access, and team management.",
    idealFor: "Freelancers building subscription products, startups with B2B model, agencies creating white-label platforms",
    keyChallenge: "Multi-tenancy — ensuring Company A never sees Company B's data while sharing the same database and codebase",
  },
  {
    id: "wordpress",
    name: "WordPress",
    icon: "📝",
    shortDesc: "Themes, plugins, WooCommerce sites",
    guide: "Choose this if you're building websites on WordPress — from simple corporate sites to complex e-commerce stores with WooCommerce. Covers custom themes, custom plugins, performance optimization, and security hardening. WordPress powers 43% of the web, so this Blueprint covers the most common web development scenario.",
    idealFor: "Web agencies, freelance developers, anyone building client websites or WordPress products (themes/plugins for sale)",
    keyChallenge: "Code quality — WordPress's flexibility makes it easy to write bad code. The Blueprint enforces WordPress Coding Standards, proper hook architecture, and security best practices",
  },
  {
    id: "ecommerce",
    name: "E-commerce Headless",
    icon: "🛒",
    shortDesc: "Decoupled storefront + commerce backend",
    guide: "Choose this if you're building an online store where the frontend (what customers see) is separate from the commerce engine (products, cart, checkout). This 'headless' approach gives you full control over the shopping experience while using a proven commerce backend. Think: custom storefront with Shopify/Medusa handling the business logic.",
    idealFor: "Brands wanting unique shopping experiences, agencies building high-performance stores, D2C companies with custom requirements",
    keyChallenge: "Checkout reliability — the path from 'Add to Cart' to 'Order Confirmed' must be bulletproof. Race conditions, inventory sync, and payment verification are critical",
  },
  {
    id: "mobile",
    name: "Mobile App",
    icon: "📱",
    shortDesc: "iOS & Android applications",
    guide: "Choose this if you're building a mobile application for phones and tablets. Covers cross-platform frameworks (one codebase for iOS + Android) and native development. Includes offline-first patterns, push notifications, app store deployment, and mobile-specific UX conventions.",
    idealFor: "Startups launching mobile products, companies adding mobile apps to existing services, indie developers",
    keyChallenge: "Offline resilience — mobile users lose connectivity constantly. The Blueprint ensures your app works offline and syncs gracefully when back online",
  },
  {
    id: "data",
    name: "Data Platform",
    icon: "📊",
    shortDesc: "ETL pipelines, warehouses, dashboards",
    guide: "Choose this if you're building data infrastructure — collecting data from multiple sources, transforming it, storing it in a warehouse, and visualizing it. Covers ETL/ELT pipelines, data quality checks, scheduling, and analytics dashboards. Think: 'we have data everywhere and need to make sense of it.'",
    idealFor: "Data engineers, companies building internal analytics, startups offering data products, BI consultants",
    keyChallenge: "Data quality — bad data in means bad decisions out. The Blueprint enforces validation at every pipeline stage, monitoring, and alerting",
  },
  {
    id: "custom",
    name: "Custom Domain",
    icon: "⚙️",
    shortDesc: "Define your own project type",
    guide: "Choose this if your project doesn't fit the predefined domains. You'll describe your domain and stack manually, and the compiler will generate a Blueprint tailored to your specific needs. Examples: IoT dashboard, game backend, AI/ML platform, DevOps tooling, embedded systems.",
    idealFor: "Niche or specialized projects, experimental architectures, domains not covered by the standard templates",
    keyChallenge: "You'll need to provide enough detail about your stack and architecture for the AI to generate useful, specific Blueprint files",
  },
];

const STACK_INFO = {
  saas: {
    intro: "These choices define the foundation of your SaaS application. Each technology was selected because it works well in a multi-tenant B2B context. The defaults are a proven, modern stack — change them only if you have a specific reason.",
    categories: [
      {
        key: "framework", label: "Frontend Framework",
        why: "Determines how your application renders pages, handles routing, and manages server/client code. This is the biggest architectural choice — it affects everything else.",
        options: [
          { value: "Next.js 15", guide: "The industry standard for React-based SaaS. Server components reduce client-side JavaScript, App Router provides excellent SEO. Largest ecosystem of tools and tutorials. Choose this unless you have a strong reason not to." },
          { value: "Nuxt 3", guide: "Vue.js equivalent of Next.js. Excellent if your team prefers Vue's more approachable syntax. Smaller ecosystem than Next.js but growing rapidly. Strong SSR and auto-imports." },
          { value: "SvelteKit", guide: "Compiles to vanilla JS — smallest bundle sizes and fastest runtime. Newer ecosystem with fewer third-party integrations. Best for performance-critical applications where bundle size matters." },
          { value: "Remix", guide: "Web-standards focused framework. Excellent form handling and progressive enhancement. Great for content-heavy SaaS. Smaller community than Next.js." },
        ],
        default: 0,
      },
      {
        key: "api", label: "API Layer",
        why: "How your frontend communicates with your backend. Affects type safety, developer experience, and how easily you can evolve your API over time.",
        options: [
          { value: "tRPC", guide: "End-to-end TypeScript type safety without code generation. Your frontend knows exactly what the backend accepts and returns. Zero API documentation needed — the types ARE the documentation. Best for teams using TypeScript everywhere." },
          { value: "GraphQL (Apollo)", guide: "Flexible query language — frontend requests exactly the data it needs. Excellent for complex data relationships. Higher learning curve and more infrastructure (schema, resolvers, codegen). Best for large teams or public APIs." },
          { value: "REST (Express)", guide: "The simplest and most widely understood approach. Every developer knows REST. Less type safety without extra tooling. Best for teams with mixed experience levels or when interoperating with external systems." },
          { value: "Hono", guide: "Ultra-lightweight, edge-first API framework. Runs on Cloudflare Workers, Deno, Bun. Excellent performance. Newer with smaller ecosystem. Best for edge-computing architectures." },
        ],
        default: 0,
      },
      {
        key: "orm", label: "ORM & Database",
        why: "How your application stores and queries data. The ORM provides a type-safe interface to the database. Critical for multi-tenancy — you need reliable data isolation between tenants.",
        options: [
          { value: "Drizzle + PostgreSQL", guide: "Lightweight, SQL-like ORM with zero overhead. You write queries that look like SQL but are fully typed. PostgreSQL is the gold standard for SaaS — ACID compliance, Row Level Security for multi-tenancy, excellent JSON support." },
          { value: "Prisma + PostgreSQL", guide: "More abstracted ORM with its own schema language and migration system. Easier to learn, larger community. Slightly more overhead than Drizzle. The most popular choice in the Next.js ecosystem." },
          { value: "TypeORM + PostgreSQL", guide: "Decorator-based ORM familiar to Java/C# developers. More mature but less actively maintained. Heavier abstraction. Choose if your team comes from enterprise backgrounds." },
          { value: "Mongoose + MongoDB", guide: "Document database — flexible schemas, great for rapidly evolving data models. NOT recommended for multi-tenant SaaS due to weaker transaction support and harder data isolation. Choose only if your data is truly document-oriented." },
        ],
        default: 0,
      },
      {
        key: "auth", label: "Authentication",
        why: "How users log in and how your app verifies their identity. Also handles sessions, JWT tokens, OAuth (Google/GitHub login), and team invitations.",
        options: [
          { value: "NextAuth.js", guide: "Open-source, self-hosted. Full control over data and flow. Free forever. Requires more setup but you own everything. Best for privacy-sensitive applications or when you want to avoid vendor lock-in." },
          { value: "Clerk", guide: "Managed auth service with beautiful pre-built UI components. Handles everything: sign-up, login, MFA, organizations. Free tier available, paid plans per active user. Best for shipping fast without building auth from scratch." },
          { value: "Auth0", guide: "Enterprise-grade managed auth. Extremely flexible and battle-tested. More complex configuration but handles any authentication scenario. Best for applications with complex auth requirements (SAML, LDAP, enterprise SSO)." },
          { value: "Supabase Auth", guide: "Built into Supabase — if you're already using Supabase for your database, auth comes free. Row Level Security integrates naturally with auth. Best when you're going all-in on the Supabase ecosystem." },
          { value: "Custom JWT", guide: "Build auth from scratch. Maximum control, maximum responsibility. You handle password hashing, token rotation, session management. Only choose this if you have specific requirements that no managed solution covers." },
        ],
        default: 0,
      },
      {
        key: "billing", label: "Billing & Subscriptions",
        why: "How you charge customers. This includes subscription plans, usage metering, invoices, tax handling, and dunning (failed payment recovery). Getting billing wrong loses you money directly.",
        options: [
          { value: "Stripe", guide: "The gold standard. Handles subscriptions, one-time payments, invoicing, tax calculation, PCI compliance. Excellent developer experience, webhooks for every event. 2.9% + 30¢ per transaction. Choose this unless you have a reason not to." },
          { value: "Paddle", guide: "Merchant of Record — Paddle handles VAT, sales tax, and compliance for you. Higher fees but zero tax headaches. Best for solo founders or small teams selling globally who don't want to deal with tax compliance." },
          { value: "LemonSqueezy", guide: "Similar to Paddle but simpler and more affordable. Good for digital products and SaaS. Best for indie hackers and small projects." },
          { value: "None", guide: "No billing integration. Choose for internal tools, open-source projects, or if you're adding billing later." },
        ],
        default: 0,
      },
      {
        key: "hosting", label: "Hosting & Deploy",
        why: "Where your application runs in production. Affects performance, cost, scalability, and deployment complexity.",
        options: [
          { value: "Vercel", guide: "Zero-config deployment for Next.js (they built Next.js). Push to Git → deployed in seconds. Generous free tier. Best for Next.js projects with moderate traffic." },
          { value: "AWS", guide: "Maximum control and scalability. Handles any traffic level. Steeper learning curve. Best for enterprise applications with specific compliance requirements." },
          { value: "Railway", guide: "Simple PaaS — deploy anything with a Dockerfile. Good pricing model. Best for applications that need background workers, cron jobs, or custom infrastructure." },
          { value: "Fly.io", guide: "Edge deployment — your app runs close to your users globally. Container-based. Best for globally distributed user bases." },
        ],
        default: 0,
      },
    ],
  },
  wordpress: {
    intro: "WordPress development quality varies enormously. These choices determine whether your site will be fast, secure, and maintainable — or a fragile mess. The defaults follow WordPress.org best practices and VIP coding standards.",
    categories: [
      {
        key: "wpversion", label: "WordPress Version",
        why: "Determines which PHP features, block editor capabilities, and security patches are available.",
        options: [
          { value: "WordPress 6.7+", guide: "Latest stable. Full Site Editing matured, block bindings, improved performance. Requires PHP 8.1+. Choose this for all new projects." },
          { value: "WordPress 6.5+", guide: "Slightly older but very stable. Choose only if your hosting or critical plugins don't support 6.7 yet." },
          { value: "WordPress 6.0+", guide: "Minimum for modern block theme development. Choose only for legacy compatibility requirements." },
        ],
        default: 0,
      },
      {
        key: "builder", label: "Page Builder / Editor",
        why: "How content editors build pages. This affects theme architecture, performance, and long-term maintainability.",
        options: [
          { value: "Gutenberg (Block Editor)", guide: "WordPress's native editor. Zero performance overhead. Block themes with theme.json give you a complete design system. THE recommended choice for professional development." },
          { value: "Bricks Builder", guide: "Performance-focused visual builder. Renders clean HTML/CSS without shortcode bloat. Good balance between visual editing and code quality." },
          { value: "Elementor Pro", guide: "Most popular visual builder. BUT: significant performance overhead (adds 300KB+ of CSS/JS), shortcode lock-in. Choose only if client requires drag-and-drop." },
          { value: "Oxygen", guide: "Code-oriented visual builder. Clean markup. Development has slowed. Choose only if already invested in Oxygen." },
        ],
        default: 0,
      },
      {
        key: "ecommerce", label: "E-commerce",
        why: "Whether the site sells products. WooCommerce adds significant complexity — only include if needed.",
        options: [
          { value: "WooCommerce", guide: "The standard for WordPress e-commerce. Handles products, cart, checkout, orders. Only include if selling products." },
          { value: "Easy Digital Downloads", guide: "Lightweight alternative for selling digital products only. Much simpler than WooCommerce." },
          { value: "None", guide: "No e-commerce. For corporate sites, blogs, portfolios, or any site that doesn't sell products directly." },
        ],
        default: 0,
      },
      {
        key: "seo", label: "SEO Plugin",
        why: "Manages meta tags, sitemaps, schema markup, and content optimization. Essential for search engine ranking.",
        options: [
          { value: "Yoast SEO", guide: "Most established. Excellent content analysis and readability scoring. The safe, proven choice." },
          { value: "Rank Math", guide: "More free features than Yoast. Built-in schema generator, keyword tracking, redirect manager." },
          { value: "SEOPress", guide: "Lightweight, no ads in admin. Clean interface, good performance." },
        ],
        default: 0,
      },
      {
        key: "caching", label: "Caching Strategy",
        why: "Caching is the single biggest performance factor. A properly cached site loads in under 1 second vs 5+ uncached.",
        options: [
          { value: "WP Rocket + Redis", guide: "WP Rocket handles page caching + optimization. Redis handles object caching. THE recommended stack." },
          { value: "LiteSpeed Cache", guide: "Free, excellent performance. ONLY works on LiteSpeed hosting." },
          { value: "W3 Total Cache", guide: "Free, highly configurable. Complex configuration — can break your site if misconfigured." },
        ],
        default: 0,
      },
      {
        key: "hosting", label: "Hosting",
        why: "WordPress hosting quality directly affects speed, security, and uptime.",
        options: [
          { value: "Kinsta", guide: "Premium managed WordPress on Google Cloud. Automatic backups, staging, CDN included. Starting $35/month." },
          { value: "Cloudways", guide: "Managed cloud hosting. More control than Kinsta, lower starting price ($11/month)." },
          { value: "SiteGround", guide: "Good balance of quality and price. Staging, backups, CDN included." },
          { value: "WP Engine", guide: "Enterprise-grade. Built-in Genesis framework. Premium pricing." },
          { value: "Custom VPS", guide: "Full control with DigitalOcean/Hetzner. Lowest cost, highest responsibility." },
        ],
        default: 0,
      },
    ],
  },
  ecommerce: {
    intro: "Headless e-commerce separates your storefront from your commerce engine. Complete creative freedom for the shopping experience with battle-tested commerce infrastructure.",
    categories: [
      {
        key: "platform", label: "Commerce Platform",
        why: "The backend managing products, inventory, orders, and payments.",
        options: [
          { value: "Shopify + Hydrogen", guide: "Shopify handles commerce while Hydrogen is their React storefront framework. Largest ecosystem." },
          { value: "Medusa.js", guide: "Open-source, self-hosted. Full control, no per-transaction fees. Node.js based." },
          { value: "Saleor", guide: "Open-source, GraphQL-first. Python/Django backend. Strong multi-channel support." },
          { value: "Commerce.js", guide: "API-first commerce backend. Simpler than Shopify for developers." },
        ],
        default: 0,
      },
      {
        key: "storefront", label: "Storefront Framework",
        why: "The frontend rendering your store. Must excel at SEO, performance, and dynamic content.",
        options: [
          { value: "Next.js 15", guide: "Industry standard. Server components for SEO, client components for interactivity." },
          { value: "Nuxt 3", guide: "Vue.js alternative. Excellent SSR and auto-imports." },
          { value: "Remix", guide: "Outstanding form handling. Progressive enhancement means checkout works without JS." },
          { value: "Astro", guide: "Ships zero JS by default. Excellent for catalog-heavy stores." },
        ],
        default: 0,
      },
      {
        key: "search", label: "Search & Discovery",
        why: "30% of visitors use search and convert 2-3x higher. Critical for revenue.",
        options: [
          { value: "Algolia", guide: "Gold standard. Instant results, typo tolerance, AI ranking. Generous free tier." },
          { value: "Meilisearch", guide: "Open-source Algolia alternative. Self-hosted, fast, free forever." },
          { value: "Typesense", guide: "Open-source, lightweight. Good for small-medium catalogs." },
          { value: "Built-in", guide: "Use platform's native search. For catalogs under 500 products." },
        ],
        default: 0,
      },
      {
        key: "payments", label: "Payment Processing",
        why: "How customers pay. Must support local methods and comply with PCI DSS.",
        options: [
          { value: "Stripe", guide: "Best developer experience. 135+ currencies. The default choice." },
          { value: "PayPal + Stripe", guide: "Adding PayPal captures ~30% more customers. Higher conversion." },
          { value: "Adyen", guide: "Enterprise platform. 250+ payment methods. Better rates at volume." },
          { value: "Platform native", guide: "Use platform's built-in payments. Simplest setup." },
        ],
        default: 0,
      },
      {
        key: "cdn", label: "Image & Media CDN",
        why: "Product images are the heaviest assets. A CDN directly affects load speed and conversions.",
        options: [
          { value: "Cloudinary", guide: "Most feature-rich. On-the-fly transformations, AI cropping, video." },
          { value: "Imgix", guide: "URL-based processing. Fast, reliable, great DX." },
          { value: "Vercel Image", guide: "Built into Vercel. Zero config with Next.js Image component." },
          { value: "Cloudflare Images", guide: "Part of Cloudflare ecosystem. Competitive pricing." },
        ],
        default: 0,
      },
      {
        key: "hosting", label: "Hosting & Deploy",
        why: "E-commerce requires high availability — downtime = lost sales.",
        options: [
          { value: "Vercel", guide: "Best for Next.js storefronts. Edge functions, auto-scaling." },
          { value: "Netlify", guide: "Good for Remix/Astro. Edge functions, form handling." },
          { value: "AWS", guide: "Maximum control. CloudFront CDN, Lambda@Edge." },
          { value: "Shopify Oxygen", guide: "Shopify's hosting for Hydrogen. Simplest deployment." },
        ],
        default: 0,
      },
    ],
  },
  mobile: {
    intro: "Mobile development choices affect development speed, app performance, and maintenance burden.",
    categories: [
      {
        key: "framework", label: "Mobile Framework",
        why: "Cross-platform (one codebase for iOS + Android) or separate native codebases.",
        options: [
          { value: "React Native (Expo)", guide: "Write in React/TypeScript, deploy to both platforms. Expo handles builds and native APIs." },
          { value: "Flutter", guide: "Google's framework using Dart. Beautiful custom UI, excellent performance." },
          { value: "SwiftUI (iOS)", guide: "Apple's native. Best iOS performance. iOS only." },
          { value: "Kotlin (Android)", guide: "Google's preferred language for Android. Android only." },
        ],
        default: 0,
      },
      {
        key: "state", label: "State Management",
        why: "How your app manages data in memory — affects bugs, re-renders, and responsiveness.",
        options: [
          { value: "Zustand", guide: "Minimal, flexible, TypeScript-first. Best for most React Native apps." },
          { value: "Redux Toolkit", guide: "Enterprise standard. Excellent debugging tools." },
          { value: "Riverpod", guide: "Flutter's recommended. Compile-safe, testable. Flutter only." },
          { value: "MobX", guide: "Observable-based reactive state. Minimal boilerplate." },
        ],
        default: 0,
      },
      {
        key: "backend", label: "Backend / BaaS",
        why: "Where your app stores data and runs server logic.",
        options: [
          { value: "Supabase", guide: "Open-source Firebase alternative. PostgreSQL, auth, realtime, storage." },
          { value: "Firebase", guide: "Google's BaaS. NoSQL, auth, push notifications, analytics." },
          { value: "Custom API (Node)", guide: "Build your own. Full control, no vendor lock-in." },
          { value: "Appwrite", guide: "Open-source, self-hosted BaaS. Database, auth, storage, functions." },
        ],
        default: 0,
      },
      {
        key: "navigation", label: "Navigation",
        why: "How users move between screens. Tabs, stacks, drawers, modals.",
        options: [
          { value: "React Navigation", guide: "The standard for React Native. Tabs, stacks, drawers, deep linking." },
          { value: "Expo Router", guide: "File-based routing (like Next.js for mobile). Newer but maturing fast." },
          { value: "Go Router", guide: "Flutter's declarative routing. URL-based, deep linking." },
          { value: "Native", guide: "Platform-native navigation. Best performance, separate implementations." },
        ],
        default: 0,
      },
      {
        key: "offline", label: "Offline Storage",
        why: "Mobile users lose connectivity constantly. This determines if your app crashes or continues.",
        options: [
          { value: "WatermelonDB", guide: "Built for React Native. Lazy-loaded, observable, sync primitives." },
          { value: "SQLite (Expo)", guide: "Standard embedded database. Good for basic offline needs." },
          { value: "Hive", guide: "Lightweight key-value for Flutter. Fast, no native dependencies." },
          { value: "None", guide: "App requires internet. Only for live streaming or real-time collaboration." },
        ],
        default: 0,
      },
      {
        key: "distribution", label: "Build & Distribution",
        why: "How you compile and distribute to App Store / Google Play.",
        options: [
          { value: "EAS Build", guide: "Expo's cloud build. Builds iOS without a Mac, OTA updates." },
          { value: "Fastlane", guide: "Open-source automation. Works with any framework." },
          { value: "Codemagic", guide: "CI/CD for mobile. Supports Flutter, React Native, native." },
          { value: "Manual", guide: "Build locally with Xcode/Android Studio. Solo developers only." },
        ],
        default: 0,
      },
    ],
  },
  data: {
    intro: "Data platforms are about reliability and trust. These choices define how data flows from sources through transformations into consumable insights.",
    categories: [
      {
        key: "orchestrator", label: "Orchestrator",
        why: "Manages when and how pipelines run. Handles scheduling, dependencies, retries, alerting.",
        options: [
          { value: "Apache Airflow", guide: "Industry standard. Python-based, massive community. Complex but handles anything." },
          { value: "Dagster", guide: "Modern alternative. Software-defined assets. Better testing and local dev." },
          { value: "Prefect", guide: "Python-native. Simpler than Airflow, cloud-hosted option." },
          { value: "n8n", guide: "Visual workflow builder. Low-code, self-hostable. Best for lightweight pipelines." },
        ],
        default: 0,
      },
      {
        key: "warehouse", label: "Data Warehouse",
        why: "Where transformed, analysis-ready data lives. Must handle large volumes and complex queries.",
        options: [
          { value: "BigQuery", guide: "Google's serverless warehouse. No maintenance, pay per query. Generous free tier." },
          { value: "Snowflake", guide: "Most popular independent warehouse. Multi-cloud, data sharing." },
          { value: "ClickHouse", guide: "Open-source columnar DB. Blazing fast analytics. Self-hosted or cloud." },
          { value: "DuckDB", guide: "Embedded analytical DB. No server needed. Handles GBs on a laptop." },
        ],
        default: 0,
      },
      {
        key: "transform", label: "Transformation",
        why: "How you clean, join, aggregate raw data into analysis-ready tables.",
        options: [
          { value: "dbt", guide: "SQL-based framework. Version-controlled, documented, tested. The standard." },
          { value: "SQLMesh", guide: "Modern dbt alternative. Column-level lineage, virtual environments." },
          { value: "Custom Python", guide: "Pandas, PySpark, Polars. Maximum flexibility for complex transforms." },
          { value: "Spark", guide: "Distributed computing. Petabyte-scale. Overkill for most teams." },
        ],
        default: 0,
      },
      {
        key: "viz", label: "Visualization",
        why: "How stakeholders consume data. Dashboards must be fast, clear, and trustworthy.",
        options: [
          { value: "Metabase", guide: "Open-source, beautiful, approachable. Non-technical users can self-serve." },
          { value: "Grafana", guide: "Open-source, excellent for real-time and time-series. Alerts built in." },
          { value: "Power BI", guide: "Microsoft's enterprise BI. Deep Office integration. DAX for calculations." },
          { value: "Superset", guide: "Open-source Apache project. Tableau-like features without the cost." },
        ],
        default: 0,
      },
      {
        key: "streaming", label: "Real-time Streaming",
        why: "Process data as it arrives (streaming) or in batches. Streaming adds complexity.",
        options: [
          { value: "Kafka", guide: "Industry standard. Millions of events/second. Complex but rock-solid." },
          { value: "Redis Streams", guide: "Lightweight, built into Redis. Good for moderate throughput." },
          { value: "None", guide: "Batch only. Simpler architecture. Most analytics work fine with hourly batches." },
          { value: "Flink", guide: "Distributed stream processing. Complex event processing, exactly-once." },
        ],
        default: 0,
      },
      {
        key: "storage", label: "Raw Data Storage",
        why: "Where raw data lives before transformation. Preserves originals for reprocessing.",
        options: [
          { value: "S3 / MinIO", guide: "The standard. Cheap, durable, scalable. Parquet on S3 is universal." },
          { value: "GCS", guide: "Google Cloud Storage. Integrates with BigQuery." },
          { value: "Azure Blob", guide: "Microsoft's object storage. Integrates with Azure ecosystem." },
          { value: "Local", guide: "Filesystem only. For development or personal projects." },
        ],
        default: 0,
      },
    ],
  },
  custom: { intro: "You'll define your own stack below.", categories: [] },
};

const LANGUAGES = [
  { code: "it", label: "🇮🇹 Italiano" },
  { code: "en", label: "🇬🇧 English" },
  { code: "es", label: "🇪🇸 Español" },
  { code: "de", label: "🇩🇪 Deutsch" },
  { code: "fr", label: "🇫🇷 Français" },
  { code: "pt", label: "🇧🇷 Português" },
];

const FILE_TYPES = [
  { id: "rules", label: "rules.md", layer: "Layer 2", desc: "Workspace Rules — the core of your Blueprint. Defines identity, stack, architecture, conventions, and security.", lines: "400-500" },
  { id: "skills", label: "Skills", layer: "Layer 3", desc: "Modular competencies loaded on-demand. Each skill teaches the agent HOW to do a specific task with templates and constraints.", lines: "500-700" },
  { id: "workflows", label: "Workflows", layer: "Layer 4", desc: "Step-by-step procedures that enforce correct order of operations. The agent follows these like a checklist.", lines: "200-300" },
  { id: "context", label: "Context", layer: "Layer 5", desc: "Architecture Decision Records documenting WHY each tech was chosen, plus coding style conventions.", lines: "300-400" },
  { id: "prompt", label: "PROMPT_START", layer: "Entry", desc: "The bootstrap file — project overview, file tree, quick start commands.", lines: "60-80" },
];

// ─── UI COMPONENTS ───

function InfoBox({ children, type = "info" }) {
  const colors = {
    info: { bg: "#0c1929", border: "#1e3a5f", icon: "💡", text: "#7dd3fc" },
    tip: { bg: "#021c14", border: "#065f46", icon: "✅", text: "#6ee7b7" },
    warn: { bg: "#1c1208", border: "#92400e", icon: "⚠️", text: "#fbbf24" },
  };
  const c = colors[type];
  return (
    <div style={{ padding: "12px 16px", background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 13, lineHeight: 1.6, color: c.text, margin: "12px 0" }}>
      <span style={{ marginRight: 8 }}>{c.icon}</span>{children}
    </div>
  );
}

function OptionGuide({ text, isSelected }) {
  if (!text) return null;
  return (
    <div style={{
      fontSize: 12, lineHeight: 1.5, color: isSelected ? "#94a3b8" : "#64748b",
      padding: "8px 12px", background: isSelected ? "#0f172a" : "transparent",
      borderRadius: 6, marginTop: 6, borderLeft: isSelected ? "3px solid #fb923c" : "3px solid transparent",
      transition: "all 0.2s"
    }}>
      {text}
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #334155", background: copied ? "#065f46" : "#1e293b", color: copied ? "#6ee7b7" : "#94a3b8", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function StepBar({ steps, current }) {
  return (
    <div style={{ display: "flex", gap: 0, marginBottom: 32, padding: "0 10px" }}>
      {steps.map((s, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700,
            background: i < current ? "#065f46" : i === current ? "#c2410c" : "#1e293b",
            color: i <= current ? "#fff" : "#475569",
            border: i === current ? "2px solid #fb923c" : "2px solid transparent",
            boxShadow: i === current ? "0 0 12px rgba(251,146,60,0.25)" : "none"
          }}>
            {i < current ? "✓" : i + 1}
          </div>
          <span style={{ fontSize: 10, color: i <= current ? "#e2e8f0" : "#475569", marginTop: 5, textAlign: "center", fontWeight: i === current ? 600 : 400 }}>{s}</span>
          {i < steps.length - 1 && <div style={{ position: "absolute", top: 16, left: "calc(50% + 20px)", right: "calc(-50% + 20px)", height: 2, background: i < current ? "#065f46" : "#1e293b" }} />}
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#fb923c" }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ───

export default function App() {
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem("bc_api_key") || "");
  const [showKeyInfo, setShowKeyInfo] = useState(false);
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({
    domain: "", projectName: "", mission: "",
    langConvo: "it", langCode: "en",
    stack: {}, customDomain: "", customStack: "",
    priorities: ["performance", "security", "maintainability", "scalability"],
  });
  const [generated, setGenerated] = useState({});
  const [generating, setGenerating] = useState(null);
  const [activeTab, setActiveTab] = useState("rules");
  const [error, setError] = useState(null);
  const resultRef = useRef(null);

  const upd = (k, v) => setConfig(p => ({ ...p, [k]: v }));
  const domain = DOMAINS.find(d => d.id === config.domain);
  const stackInfo = STACK_INFO[config.domain] || { intro: "", categories: [] };

  // Save API key to session
  useEffect(() => {
    if (apiKey) sessionStorage.setItem("bc_api_key", apiKey);
  }, [apiKey]);

  // Initialize stack when domain changes
  useEffect(() => {
    if (config.domain && config.domain !== "custom") {
      const d = {};
      stackInfo.categories.forEach(c => { d[c.key] = c.options[c.default].value; });
      upd("stack", d);
    }
  }, [config.domain]);

  const buildPrompt = (fileType) => {
    const stackStr = config.domain === "custom"
      ? config.customStack
      : Object.entries(config.stack).map(([k, v]) => `- ${k}: ${v}`).join("\n");
    const base = `Generate the ${fileType} file(s) for this Blueprint:
## Project: ${config.projectName}
## Domain: ${domain?.name || config.customDomain}
## Mission: ${config.mission}
## Conversation Language: ${LANGUAGES.find(l => l.code === config.langConvo)?.label}
## Code Language: ${LANGUAGES.find(l => l.code === config.langCode)?.label}
## Priorities: ${config.priorities.join(" > ")}
## Tech Stack:
${stackStr}`;

    const instructions = {
      rules: `${base}\n\nGenerate the COMPLETE .antigravity/rules.md file (Layer 2 Workspace Rules). Include ALL 13 sections with real, production-ready content — no placeholders. Target: 400-500 lines. Be specific and opinionated. Start directly with the markdown content.`,
      skills: `${base}\n\nGenerate 5-7 Agent Skills for .agent/skills/. Each skill: ## Goal, ## Instructions (numbered), ## Template (compilable snippet), ## Constraints. Real code for the stack above. Start directly.`,
      workflows: `${base}\n\nGenerate 2-3 Workflows for .agent/workflows/: new-feature.md, deploy-check.md, and optionally one domain-specific. Each has numbered Steps with commands and verification. Start directly.`,
      context: `${base}\n\nGenerate .context/ files: 1) architecture.md with 5-6 ADR (Title, Status, Context, Decision, Alternatives, Consequences) 2) coding_style.md with naming conventions and patterns. Start directly.`,
      prompt: `${base}\n\nGenerate PROMPT_START.md: project overview, file tree, quick start commands, how to use the Blueprint. Max 80 lines. Start directly.`,
    };
    return instructions[fileType];
  };

  const generateFile = async (fileType) => {
    if (!apiKey) { setError("Please enter your Anthropic API key first"); return; }
    setGenerating(fileType);
    setError(null);
    setActiveTab(fileType);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8000,
          system: META_TEMPLATE_SYSTEM,
          messages: [{ role: "user", content: buildPrompt(fileType) }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      setGenerated(p => ({ ...p, [fileType]: data.content?.map(b => b.text || "").join("\n") || "" }));
    } catch (err) { setError(`${fileType}: ${err.message}`); }
    setGenerating(null);
  };

  const generateAll = async () => {
    for (const ft of FILE_TYPES) await generateFile(ft.id);
    resultRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const movePriority = (i, d) => {
    const a = [...config.priorities];
    const n = i + d;
    if (n < 0 || n >= a.length) return;
    [a[i], a[n]] = [a[n], a[i]];
    upd("priorities", a);
  };

  const canProceed = [
    () => !!config.domain,
    () => true,
    () => config.projectName.length > 2 && config.mission.length > 20,
    () => true,
  ];

  const S = {
    card: { background: "#111827", border: "1px solid #1e293b", borderRadius: 12, padding: 24, marginBottom: 20 },
    label: { fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.5px" },
    input: { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" },
    textarea: { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0", fontSize: 14, outline: "none", minHeight: 80, resize: "vertical", boxSizing: "border-box" },
    select: { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", cursor: "pointer" },
    btn: (pri, dis) => ({ padding: "11px 24px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700, cursor: dis ? "not-allowed" : "pointer", background: dis ? "#1e293b" : pri ? "linear-gradient(135deg,#c2410c,#ea580c)" : "#1e293b", color: dis ? "#475569" : pri ? "#fff" : "#94a3b8", opacity: dis ? 0.5 : 1, transition: "all 0.2s" }),
    nav: { display: "flex", justifyContent: "space-between", marginTop: 24 },
    code: { background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: "0 0 8px 8px", padding: 16, fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap", overflowX: "auto", maxHeight: 500, overflowY: "auto", color: "#cbd5e1" },
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1a", color: "#e2e8f0" }}>
      {/* Top Navigation Bar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(10,15,26,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid #1e293b", padding: "0 24px", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: "#fb923c", letterSpacing: 0.5 }}>⚡ Blueprint Compiler</span>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <a href="/" style={{ fontSize: 13, color: "#e2e8f0", textDecoration: "none", fontWeight: 600 }}>🏠 Home</a>
          <a href="/docs.html" style={{ fontSize: 13, color: "#94a3b8", textDecoration: "none", fontWeight: 500, transition: "color .15s" }} onMouseOver={e => e.target.style.color = "#fb923c"} onMouseOut={e => e.target.style.color = "#94a3b8"}>📖 Documentation</a>
          <a href="/docs.html#glossary" style={{ fontSize: 13, color: "#94a3b8", textDecoration: "none", fontWeight: 500, transition: "color .15s" }} onMouseOver={e => e.target.style.color = "#fb923c"} onMouseOut={e => e.target.style.color = "#94a3b8"}>📚 Glossary</a>
          <a href="/docs.html#faq" style={{ fontSize: 13, color: "#94a3b8", textDecoration: "none", fontWeight: 500, transition: "color .15s" }} onMouseOver={e => e.target.style.color = "#fb923c"} onMouseOut={e => e.target.style.color = "#94a3b8"}>❓ FAQ</a>
        </div>
      </nav>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 16px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fb923c", margin: 0 }}>⚡ Blueprint Compiler</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "6px 0 0" }}>Transform your project requirements into a production-ready AI agent Blueprint</p>
        </div>
        <InfoBox type="info">
          A <strong>Blueprint</strong> is a set of configuration files that transforms a generic AI agent into a specialized architect for YOUR project.
          Without a Blueprint, the agent produces generic code. With a Blueprint, it produces code that follows your exact stack, patterns, and quality standards.
        </InfoBox>

        {/* API Key Bar */}
        <div style={{ ...S.card, padding: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "#64748b", whiteSpace: "nowrap" }}>🔑 API Key:</span>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-ant-api03-..."
            style={{ ...S.input, flex: 1, minWidth: 200, fontSize: 13 }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {apiKey && <span style={{ color: "#6ee7b7", fontSize: 12 }}>✓ Saved</span>}
            <button onClick={() => setShowKeyInfo(!showKeyInfo)}
              style={{ background: "none", border: "1px solid #334155", borderRadius: 6, color: "#64748b", cursor: "pointer", padding: "4px 10px", fontSize: 12 }}>
              {showKeyInfo ? "Hide info" : "How to get a key?"}
            </button>
          </div>
          {showKeyInfo && (
            <div style={{ width: "100%", marginTop: 8 }}>
              <InfoBox type="tip">
                <strong>How to get your Anthropic API key:</strong><br />
                1. Go to <strong>console.anthropic.com</strong><br />
                2. Sign up or log in<br />
                3. Click "API Keys" in the left sidebar<br />
                4. Click "Create Key" and copy it<br />
                5. Paste it above — it stays in your browser only (session storage), never sent to any server except Anthropic's API directly.<br /><br />
                <strong>Cost:</strong> Each Blueprint generation costs approximately $0.02-0.05 (a few cents). A full Blueprint (all 5 files) costs about $0.15-0.25.
              </InfoBox>
            </div>
          )}
        </div>

        <StepBar steps={["Domain", "Stack", "Project", "Generate"]} current={step} />

        {/* ═══ STEP 0: DOMAIN ═══ */}
        {step === 0 && (
          <div style={S.card}>
            <SectionTitle icon="🎯" title="Choose Your Domain" subtitle="What type of project are you building?" />
            <InfoBox type="tip">
              Each domain comes with pre-configured technology options, specialized skills, and architecture patterns.
              If none match, choose "Custom" to define your own.
            </InfoBox>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
              {DOMAINS.map(d => (
                <div key={d.id} onClick={() => upd("domain", d.id)} style={{
                  padding: 16, borderRadius: 10, cursor: "pointer", transition: "all 0.2s",
                  border: config.domain === d.id ? "2px solid #fb923c" : "2px solid #1e293b",
                  background: config.domain === d.id ? "#1c1208" : "#0f172a",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 24 }}>{d.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: config.domain === d.id ? "#fb923c" : "#e2e8f0" }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{d.shortDesc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {config.domain && (
              <div style={{ marginTop: 20, padding: 20, background: "#0c1929", borderRadius: 10, border: "1px solid #1e3a5f" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#7dd3fc", marginBottom: 10 }}>{domain?.icon} {domain?.name} — When to Choose This</div>
                <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, margin: "0 0 12px" }}>{domain?.guide}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ padding: 12, background: "#0f172a", borderRadius: 8, borderLeft: "3px solid #065f46" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6ee7b7", marginBottom: 4 }}>IDEAL FOR</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{domain?.idealFor}</div>
                  </div>
                  <div style={{ padding: 12, background: "#0f172a", borderRadius: 8, borderLeft: "3px solid #92400e" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24", marginBottom: 4 }}>KEY CHALLENGE</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{domain?.keyChallenge}</div>
                  </div>
                </div>
                {config.domain === "custom" && (
                  <div style={{ marginTop: 16 }}>
                    <label style={S.label}>Describe your domain</label>
                    <textarea style={S.textarea} value={config.customDomain} onChange={e => upd("customDomain", e.target.value)}
                      placeholder="Example: IoT monitoring platform for industrial manufacturing..." />
                    <label style={{ ...S.label, marginTop: 12 }}>Define your tech stack</label>
                    <textarea style={S.textarea} value={config.customStack} onChange={e => upd("customStack", e.target.value)}
                      placeholder="Example:&#10;- Frontend: Next.js 15&#10;- Backend: Node.js with Fastify&#10;- Database: TimescaleDB" />
                  </div>
                )}
              </div>
            )}
            <div style={S.nav}>
              <div />
              <button style={S.btn(true, !canProceed[0]())} onClick={() => canProceed[0]() && setStep(1)}>Configure Stack →</button>
            </div>
          </div>
        )}

        {/* ═══ STEP 1: STACK ═══ */}
        {step === 1 && (
          <div style={S.card}>
            <SectionTitle icon={domain?.icon} title={`${domain?.name} — Technology Stack`} subtitle="Defaults are battle-tested — change only with a clear reason." />
            <InfoBox type="info">{stackInfo.intro}</InfoBox>
            {config.domain === "custom" ? (
              <InfoBox type="tip">Your custom stack was defined in the previous step. Proceed to project details.</InfoBox>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 8 }}>
                {stackInfo.categories.map(cat => {
                  const selectedOpt = cat.options.find(o => o.value === config.stack[cat.key]);
                  return (
                    <div key={cat.key} style={{ padding: 16, background: "#0f172a", borderRadius: 10, border: "1px solid #1e293b" }}>
                      <label style={{ ...S.label, margin: 0 }}>{cat.label}</label>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, lineHeight: 1.5 }}>{cat.why}</div>
                      <select style={S.select} value={config.stack[cat.key] || ""}
                        onChange={e => upd("stack", { ...config.stack, [cat.key]: e.target.value })}>
                        {cat.options.map(o => <option key={o.value} value={o.value}>{o.value}</option>)}
                      </select>
                      {selectedOpt && <OptionGuide text={selectedOpt.guide} isSelected={true} />}
                    </div>
                  );
                })}
              </div>
            )}
            <div style={S.nav}>
              <button style={S.btn(false)} onClick={() => setStep(0)}>← Domain</button>
              <button style={S.btn(true)} onClick={() => setStep(2)}>Project Details →</button>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: PROJECT ═══ */}
        {step === 2 && (
          <div style={S.card}>
            <SectionTitle icon="📋" title="Project Details" subtitle="The more precise you are, the more useful the generated files." />
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={S.label}>Project Name</label>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Short, lowercase, hyphenated. Used in folders, packages, git repos.</div>
                <input style={S.input} value={config.projectName} onChange={e => upd("projectName", e.target.value)}
                  placeholder="e.g. invoice-saas, flavor-theme, shopfront-headless" />
              </div>
              <div>
                <label style={S.label}>Project Mission</label>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>1-3 sentences: what you're building, for whom, and why. This is the most important input.</div>
                <textarea style={{ ...S.textarea, minHeight: 100 }} value={config.mission} onChange={e => upd("mission", e.target.value)}
                  placeholder="Example: Multi-tenant invoicing platform for European freelancers. Supports automatic VAT calculation, multi-currency, PDF generation, and Stripe billing." />
                <span style={{ fontSize: 11, color: config.mission.length < 20 ? "#ef4444" : config.mission.length < 80 ? "#fbbf24" : "#6ee7b7" }}>
                  {config.mission.length < 20 ? "⚠️ Too short" : config.mission.length < 80 ? "📝 Good, more detail helps" : "✅ Great detail"} ({config.mission.length} chars)
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={S.label}>Conversation Language</label>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>Language for AI explanations and plans.</div>
                  <select style={S.select} value={config.langConvo} onChange={e => upd("langConvo", e.target.value)}>
                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Code Language</label>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>Language for code, comments, commits. English recommended.</div>
                  <select style={S.select} value={config.langCode} onChange={e => upd("langCode", e.target.value)}>
                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={S.label}>Architecture Priorities</label>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>When the agent faces trade-offs, it prioritizes based on this ranking.</div>
                {config.priorities.map((p, i) => (
                  <div key={p} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", marginBottom: 4, background: "#0f172a", borderRadius: 6, border: "1px solid #1e293b" }}>
                    <span style={{ color: i === 0 ? "#fb923c" : "#64748b", fontWeight: 700, fontSize: 13, width: 24 }}>#{i + 1}</span>
                    <span style={{ flex: 1, fontSize: 14, textTransform: "capitalize", color: i === 0 ? "#e2e8f0" : "#94a3b8" }}>{p}</span>
                    <button onClick={() => movePriority(i, -1)} disabled={i === 0} style={{ background: "none", border: "none", color: i === 0 ? "#1e293b" : "#64748b", cursor: "pointer", fontSize: 15, padding: "0 4px" }}>↑</button>
                    <button onClick={() => movePriority(i, 1)} disabled={i === config.priorities.length - 1} style={{ background: "none", border: "none", color: i === config.priorities.length - 1 ? "#1e293b" : "#64748b", cursor: "pointer", fontSize: 15, padding: "0 4px" }}>↓</button>
                  </div>
                ))}
              </div>
            </div>
            <div style={S.nav}>
              <button style={S.btn(false)} onClick={() => setStep(1)}>← Stack</button>
              <button style={S.btn(true, !canProceed[2]())} onClick={() => canProceed[2]() && setStep(3)}>Review & Generate →</button>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: GENERATE ═══ */}
        {step === 3 && (
          <>
            <div style={S.card}>
              <SectionTitle icon="🔍" title="Review Configuration" subtitle="Verify before generating." />
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Project</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#fb923c", marginTop: 4 }}>{config.projectName}</div>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 6, lineHeight: 1.5 }}>{config.mission}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 32 }}>{domain?.icon}</span>
                  <div style={{ fontSize: 13, color: "#64748b" }}>{domain?.name}</div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>Priorities: {config.priorities.join(" > ")}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 16 }}>
                {Object.entries(config.stack).map(([k, v]) => (
                  <div key={k} style={{ padding: "6px 10px", background: "#0f172a", borderRadius: 6, fontSize: 11 }}>
                    <span style={{ color: "#475569" }}>{k}: </span><span style={{ color: "#e2e8f0", fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
              {!apiKey && <InfoBox type="warn">You need to enter your Anthropic API key above before generating.</InfoBox>}
              <div style={S.nav}>
                <button style={S.btn(false)} onClick={() => setStep(2)}>← Edit</button>
                <button style={S.btn(true, !!generating || !apiKey)} onClick={generateAll}>
                  {generating ? `⏳ Generating ${generating}...` : "⚡ Generate All Blueprint Files"}
                </button>
              </div>
            </div>

            <div ref={resultRef} style={S.card}>
              <InfoBox type="info">Each file serves a specific purpose. Generate all, or click individual tabs.</InfoBox>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 12 }}>
                {FILE_TYPES.map(ft => (
                  <button key={ft.id} style={{
                    padding: "8px 14px", borderRadius: "8px 8px 0 0", border: "1px solid #1e293b",
                    borderBottom: activeTab === ft.id ? "2px solid #fb923c" : "1px solid #1e293b",
                    background: activeTab === ft.id ? "#111827" : "#0a0f1a",
                    color: activeTab === ft.id ? "#fb923c" : "#64748b",
                    cursor: "pointer", fontSize: 11, fontWeight: 600
                  }} onClick={() => setActiveTab(ft.id)}>
                    {generated[ft.id] ? "✓ " : generating === ft.id ? "⏳ " : ""}{ft.label}
                  </button>
                ))}
              </div>
              {FILE_TYPES.map(ft => activeTab === ft.id && (
                <div key={ft.id}>
                  <div style={{ padding: "12px 16px", background: "#0c1929", border: "1px solid #1e3a5f", borderRadius: 0, fontSize: 12, color: "#7dd3fc", lineHeight: 1.6 }}>
                    <strong>{ft.layer} — {ft.label}</strong>: {ft.desc} <span style={{ color: "#475569" }}>(~{ft.lines} lines)</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "8px 12px", background: "#111827", borderBottom: "1px solid #1e293b" }}>
                    {generated[ft.id] && <CopyButton text={generated[ft.id]} />}
                    <button onClick={() => generateFile(ft.id)} disabled={!!generating || !apiKey} style={S.btn(false, !!generating || !apiKey)}>
                      {generating === ft.id ? "⏳ ..." : generated[ft.id] ? "↻ Regen" : "▶ Generate"}
                    </button>
                  </div>
                  <div style={S.code}>
                    {generating === ft.id ? (
                      <div style={{ textAlign: "center", padding: 40 }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
                        <div style={{ color: "#fb923c", fontWeight: 600 }}>Compiling {ft.label}...</div>
                      </div>
                    ) : generated[ft.id] ? generated[ft.id] : (
                      <div style={{ textAlign: "center", padding: 40, color: "#334155" }}>Click "Generate" or use "Generate All" above</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {error && <div style={{ ...S.card, borderColor: "#991b1b", background: "#1c0a0a" }}><span style={{ color: "#fca5a5", fontSize: 13 }}>⚠️ {error}</span></div>}

            {Object.keys(generated).length > 0 && (
              <div style={{ ...S.card, borderColor: "#065f46", background: "#021c14" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#6ee7b7", marginBottom: 8 }}>📁 Global Files (Layer 1) — Create Once, Use Forever</div>
                <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, marginBottom: 12 }}>
                  These go in <code style={{ color: "#fb923c" }}>~/.gemini/</code> and are identical for ALL projects. Create them once.
                </div>
                <pre style={{ ...S.code, fontSize: 11, maxHeight: 180 }}>{`# ~/.gemini/GEMINI.md
# Global Agent Rules

## Thinking Protocol
Before every complex action, use a <thought> block to:
1. Analyze requirements and constraints
2. Identify edge cases and security risks
3. Evaluate architectural alternatives
4. Plan implementation sequence

## Git Discipline
- Commit messages: feat:, fix:, refactor:, docs:, test:, chore:
- One commit = one logical change
- Branch: feat/feature-name, fix/bug-name, refactor/module-name`}</pre>
                <CopyButton text={`# Global Agent Rules\n\n## Thinking Protocol\nBefore every complex action, use a <thought> block to:\n1. Analyze requirements and constraints\n2. Identify edge cases and security risks\n3. Evaluate architectural alternatives\n4. Plan implementation sequence\n\n## Git Discipline\n- Commit messages: feat:, fix:, refactor:, docs:, test:, chore:\n- One commit = one logical change\n- Branch: feat/feature-name, fix/bug-name, refactor/module-name`} />
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "24px 0", borderTop: "1px solid #1e293b", marginTop: 24 }}>
          <p style={{ fontSize: 11, color: "#334155" }}>Blueprint Compiler v1.0 — Powered by Context Engineering</p>
        </div>
      </div>
    </div>
  );
}
