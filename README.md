# ⚡ Blueprint Compiler v2.0

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React 18](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev)
[![Vite 6](https://img.shields.io/badge/Vite-6-646cff.svg)](https://vitejs.dev)
[![Multi-IDE](https://img.shields.io/badge/IDEs-4_Targets-fb923c.svg)](#supported-ides)

> Transform project requirements into production-ready AI agent Blueprints — for **4 IDEs**, with **agentic generation**, **quality scoring**, and **cloud persistence**.

🌐 **Live:** [blueprint-compiler.vercel.app](https://blueprint-compiler.vercel.app)

---

## 🎯 What is a Blueprint?

A **Blueprint** is a set of configuration files that transforms a generic AI coding agent into a **specialized architect** that follows your exact stack, patterns, and quality standards.

Instead of repeating instructions every chat, your agent starts with deep knowledge of your project.

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **4 IDE Support** | Antigravity, Cursor, GitHub Copilot, Windsurf |
| **Agentic Generation** | Generate → Validate → Refine loop with quality scoring |
| **27 Quick Start Presets** | One-click templates across 8 categories (SaaS, AI, Commerce, Content, DevTools, Mobile, Data) |
| **Tabbed Output** | Overview, Architecture, Tools & Skills, Prompts, Raw Files |
| **Multi-Format Export** | Copy JSON, Download YAML, Download ZIP (IDE-ready) |
| **Cloud Auth** | Supabase authentication (email + GitHub) |
| **Blueprint Library** | Save/load/delete with cloud sync |
| **Community Gallery** | Browse and clone shared blueprints |
| **Auto-Detect** | Scan `package.json` to pre-fill your stack |
| **6 Domains** | SaaS B2B, WordPress, E-commerce, Mobile, Data, Custom |

## 🖥️ Supported IDEs

| IDE | Config Format | Status |
|-----|--------------|--------|
| 🔮 **Google Antigravity** | `.gemini/` | ✅ Full support |
| ⚡ **Cursor** | `.cursor/` | ✅ Full support |
| 🐙 **GitHub Copilot** | `.github/copilot/` | ✅ Full support |
| 🏄 **Windsurf** | `.windsurf/` | ✅ Full support |

## ⚡ Quick Start Presets

Click a preset card → wizard auto-fills → jump straight to Generate. Zero friction.

### 💼 Business (6 presets)

| Preset | Key Stack |
|--------|-----------|
| 🏢 SaaS Starter | Next.js 15, tRPC, Drizzle, Stripe |
| 🤝 CRM Platform | Next.js 15, Supabase, Prisma, Stripe |
| 📋 Admin Dashboard | Next.js 15, Prisma, Recharts, NextAuth |
| 📌 Project Manager | Next.js 15, Prisma, Supabase, DnD Kit |
| 👥 HR Platform | Next.js 15, Prisma, NextAuth, Resend |
| 🧾 Invoice & Billing | Next.js 15, Prisma, Stripe, PDF |

### 🤖 AI / LLM (4 presets)

| Preset | Key Stack |
|--------|-----------|
| 🤖 AI SaaS Product | Next.js 15, OpenAI, Prisma, Stripe |
| 💬 Chatbot Builder | Next.js 15, LangChain, Pinecone, OpenAI |
| ✍️ AI Content Studio | Next.js 15, OpenAI, Tiptap, Supabase |
| 🎨 AI Image Platform | Next.js 15, Replicate, Cloudinary, Stripe |

### 🛒 Commerce (4 presets)

| Preset | Key Stack |
|--------|-----------|
| 🛒 Headless Shop | Shopify, Next.js 15, Algolia, Stripe |
| 🏪 Marketplace | Medusa.js, Next.js 15, Stripe, Algolia |
| 📦 Subscription Box | Next.js 15, Stripe, Prisma, Resend |
| 📅 Booking Platform | Next.js 15, Prisma, Stripe, Cal.com |

### 📝 Content (4 presets)

| Preset | Key Stack |
|--------|-----------|
| 📝 WordPress Pro | WP 6.7+, Gutenberg, WooCommerce, WP Rocket |
| ⚡ WordPress Headless | WP 6.7+, REST API, Next.js, ISR |
| 📰 Blog Platform | Next.js 15, MDX, Resend, Plausible |
| 🎓 LMS / Course Platform | Next.js 15, Prisma, Mux, Stripe |

### 🛠️ DevTools (3 presets)

| Preset | Key Stack |
|--------|-----------|
| 🔌 API Platform | Fastify, Prisma, Redis, Swagger |
| 🖥️ DevOps Dashboard | Next.js 15, Grafana, Prometheus, Docker |
| ⌨️ CLI Tool | Node.js, Commander, Inquirer, Chalk |

### 📱 Mobile (3 presets)

| Preset | Key Stack |
|--------|-----------|
| 📱 Mobile App | Expo, Zustand, Supabase, EAS Build |
| 💪 Fitness App | Expo, Supabase, HealthKit, Zustand |
| 💰 FinTech App | Expo, Plaid, Supabase, Charts |

### 📊 Data (3 presets)

| Preset | Key Stack |
|--------|-----------|
| 📊 Data Pipeline | Airflow, BigQuery, dbt, Metabase |
| 📈 Analytics Dashboard | Next.js 15, ClickHouse, Recharts, Redis |
| 🔄 ETL Platform | Node.js, PostgreSQL, Redis, Docker |

## 🚀 Run Locally

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- An [Anthropic API key](https://console.anthropic.com/) (~$0.15-0.25 per full Blueprint)

### Install & run

```bash
git clone https://github.com/skywalker76/blueprint-compiler.git
cd blueprint-compiler
npm install
npm run dev
```

Open `http://localhost:5173` and paste your API key.

## 📋 5-Step Wizard

1. **🎯 Domain** — Choose from 6 project types (or Quick Start preset)
2. **🖥️ IDE** — Select your target IDE with file path preview
3. **⚙️ Stack** — Configure technology stack with guided explanations
4. **📋 Project** — Name, mission, language, architecture priorities
5. **⚡ Generate** — Agentic generation with quality scoring

### Generated Files (5 layers)

| File | Layer | Purpose |
|------|-------|---------|
| `rules.md` | Layer 2 | Workspace rules — stack, architecture, conventions |
| `Skills` | Layer 3 | On-demand competencies with templates |
| `Workflows` | Layer 4 | Step-by-step procedures |
| `Context` | Layer 5 | Architecture Decision Records + coding style |
| `PROMPT_START` | Entry | Bootstrap file with project overview |

### Output Tabs

The generated blueprint is displayed across 5 tabs:

- **📋 Overview** — Project summary, stack, priorities
- **🏛️ Architecture** — ADRs, folder structure, conventions
- **🛠️ Tools & Skills** — Agent competencies, templates, commands
- **💬 Prompts** — System prompts, PROMPT_START bootstrap
- **📄 Raw Files** — Individual files with copy buttons

### Export Options

- **📋 Copy JSON** — Clipboard for programmatic use
- **📄 Download YAML** — Human-readable config
- **📦 Download ZIP** — IDE-ready folder structure with all files in correct paths

## 🏗️ Architecture

```
src/
├── data/
│   ├── domains.js          # 6 project domains with guides
│   ├── stacks.js           # Technology configurations per domain
│   ├── constants.js         # IDE targets, tiers, file types
│   ├── gallery.js           # Community blueprint gallery
│   └── presets.js           # 30 Quick Start preset configs (8 categories)
├── engine/
│   ├── generator.js         # Agentic generation loop
│   ├── validator.js         # Quality scoring (0-100)
│   ├── scanner.js           # package.json auto-detect
│   └── persistence.js       # Save/load/export (JSON, YAML, ZIP)
├── components/
│   ├── AuthModal.jsx        # Login/signup modal (Supabase)
│   ├── BlueprintTabs.jsx    # 5-tab output + ExportBar
│   ├── QuickStartBar.jsx    # Preset cards grid with category filters
│   ├── QualityScore.jsx     # Score visualization
│   ├── StepBar.jsx          # Wizard progress bar
│   ├── InfoBox.jsx          # Contextual help
│   ├── OptionGuide.jsx      # Technology explanations
│   ├── CopyButton.jsx       # One-click copy
│   └── SectionTitle.jsx     # Section headers
├── context/
│   └── AuthContext.jsx      # Supabase auth provider
├── lib/
│   └── supabaseClient.js    # Supabase client config
├── pages/
│   └── LandingPage.jsx      # Marketing landing page
├── styles.js                # Design system tokens
├── App.jsx                  # Main orchestrator (wizard + generation)
└── main.jsx                 # Entry point with AuthProvider
```

## 🔒 Security

- **API keys** stored in `sessionStorage` — disappear when you close the tab
- **Authentication** via Supabase (email + GitHub OAuth)
- **Direct API calls** — your key goes only to Anthropic
- **No analytics, no tracking, no cookies**
- **Blueprints** synced to Supabase (authenticated) or `localStorage` (anonymous)

## 📦 Tech Stack

- **React 18** — UI framework
- **Vite 6** — Build tool
- **Anthropic Claude API** — AI generation
- **Supabase** — Authentication + cloud storage
- **JSZip** — ZIP file generation for exports
- **Deployed on Vercel** — Production at [blueprint-compiler.vercel.app](https://blueprint-compiler.vercel.app)

## 🛠️ Customization

### Add a new domain

Edit `src/data/domains.js` and add a matching entry in `src/data/stacks.js`.

### Add a new IDE target

Edit `src/data/constants.js` — add to the `IDE_TARGETS` array with the correct file paths.

### Add a new Quick Start preset

Edit `src/data/presets.js` — add a new object with `id`, `icon`, `title`, `subtitle`, `gradient`, `stackPills`, `ideTarget`, and a full `config` object.

### Change the AI model

Edit `src/engine/generator.js` — search for the model name and replace it.

## 📜 License

MIT — use it, modify it, ship it.

---

**Built with Context Engineering methodology.**
