// ─── STACK CONFIGURATIONS BY DOMAIN ───
export const STACK_INFO = {
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
