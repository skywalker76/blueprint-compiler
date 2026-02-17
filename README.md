# ⚡ Blueprint Compiler v2.1

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React 18](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev)
[![Vite 6](https://img.shields.io/badge/Vite-6-646cff.svg)](https://vitejs.dev)
[![Multi-IDE](https://img.shields.io/badge/IDEs-4_Targets-fb923c.svg)](#supported-ides)
[![CLI](https://img.shields.io/badge/CLI-npx_ready-22c55e.svg)](#-cli-tool)

> Transform project requirements into production-ready AI agent Blueprints — with **7 LLM models**, **CLI tool**, **smart Update Mode**, and **4 IDE targets**.

🌐 **Live:** [blueprint-compiler.vercel.app](https://blueprint-compiler.vercel.app)

---

## 🎯 What is a Blueprint?

A **Blueprint** is a set of configuration files that transforms a generic AI coding agent into a **specialized architect** that follows your exact stack, patterns, and quality standards.

Instead of repeating instructions every chat, your agent starts with deep knowledge of your project.

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **🧠 Multi-Provider LLM** | Anthropic (Claude Opus 4.6, Sonnet 4, Opus 4, Haiku 3.5) + OpenAI (GPT-5.2, GPT-4o, GPT-4.1, GPT-4o Mini, o3-mini) |
| **⌨️ CLI Tool** | `npx blueprint-compiler init` — interactive terminal wizard with auto-detection |
| **🔄 Update Mode** | Describe what changed → AI intelligently updates your Blueprint, preserving valid sections |
| **🤖 Agentic Generation** | Generate → Validate → Score → Refine autonomous loop |
| **🎯 4 IDE Support** | Antigravity, Cursor, GitHub Copilot, Windsurf |
| **⚡ 30 Quick Start Presets** | One-click templates across 8 categories |
| **📦 Multi-Format Export** | JSON, YAML, ZIP (IDE-ready folder structure) |
| **🔒 Cloud Auth & Library** | Supabase authentication, cloud sync, blueprint library |
| **📊 Auto-Detect** | Scan `package.json` to pre-fill your stack |
| **6 Domains** | SaaS B2B, WordPress, E-commerce, Mobile, Data, Custom |

## 🧠 Supported LLM Models

| Provider | Models | Default |
|----------|--------|---------|
| 🟠 **Anthropic** | Claude Opus 4.6, Claude Sonnet 4, Claude Opus 4, Claude 3.5 Haiku | Sonnet 4 |
| 🟢 **OpenAI** | GPT-5.2, GPT-4o, GPT-4.1, GPT-4o Mini, o3-mini | GPT-4o |

Select your provider and model in the web UI dropdown or during the CLI wizard.

## ⌨️ CLI Tool

Install nothing — use `npx` directly:

```bash
# Generate a Blueprint (interactive wizard)
npx blueprint-compiler init

# Update existing Blueprint after changes
npx blueprint-compiler update

# Scan project stack from package.json
npx blueprint-compiler scan
```

### CLI Features

- **7-step wizard**: Provider → Model → API Key → Domain → Project → IDE → Rigor
- **Auto-detection**: Scans `package.json` and pre-fills stack
- **IDE-aware writer**: Creates files in the correct IDE paths
- **Backup support**: Existing files backed up before overwrite
- **Zero dependencies**: Uses only Node.js built-in modules

## 🔄 Update Mode

Don't regenerate from scratch — **update intelligently**.

```
# Web UI: type in the update field after generating
"Added Redis for session caching and rate limiting"

# CLI: run the update command
npx blueprint-compiler update
→ Describe your changes: "Switched from REST API to GraphQL with Apollo"
```

The AI reads your existing Blueprint, applies your changes to only the affected sections, and preserves everything else. Same validate → refine pipeline ensures quality.

## 🖥️ Supported IDEs

| IDE | Config Format | Status |
|-----|--------------|--------|
| 🔮 **Google Antigravity** | `.gemini/` | ✅ Full support |
| ⚡ **Cursor** | `.cursor/` | ✅ Full support |
| 🐙 **GitHub Copilot** | `.github/copilot/` | ✅ Full support |
| 🏄 **Windsurf** | `.windsurf/` | ✅ Full support |

## 🚀 Quick Start

### Web App

```bash
git clone https://github.com/skywalker76/blueprint-compiler.git
cd blueprint-compiler
npm install
npm run dev
```

Open `http://localhost:5173` — select your provider, paste your API key, generate.

### CLI (no clone needed)

```bash
npx blueprint-compiler init
```

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

## 📋 5-Step Wizard

1. **🎯 Domain** — Choose from 6 project types (or Quick Start preset)
2. **🖥️ IDE** — Select your target IDE with file path preview
3. **⚙️ Stack** — Configure technology stack with guided explanations
4. **📋 Project** — Name, mission, language, architecture priorities
5. **⚡ Generate** — Agentic generation with quality scoring + Update Mode

### Generated Files (5 layers)

| File | Layer | Purpose |
|------|-------|---------|
| `rules.md` | Layer 2 | Workspace rules — stack, architecture, conventions |
| `Skills` | Layer 3 | On-demand competencies with templates |
| `Workflows` | Layer 4 | Step-by-step procedures |
| `Context` | Layer 5 | Architecture Decision Records + coding style |
| `PROMPT_START` | Entry | Bootstrap file with project overview |

## 🏗️ Architecture

```
src/
├── data/
│   ├── domains.js          # 6 project domains with guides
│   ├── stacks.js           # Technology configurations per domain
│   ├── constants.js         # IDE targets, tiers, file types
│   ├── gallery.js           # Community blueprint gallery
│   └── presets.js           # 30 Quick Start preset configs
├── engine/
│   ├── generator.js         # Agentic generation + Update Mode
│   ├── validator.js         # Quality scoring (0-100)
│   ├── scanner.js           # package.json auto-detect
│   ├── persistence.js       # Save/load/export (JSON, YAML, ZIP)
│   └── providers/
│       ├── base.js          # Abstract provider interface
│       ├── anthropic.js     # Claude Opus 4.6, Sonnet 4, Opus 4, Haiku 3.5
│       ├── openai.js        # GPT-5.2, GPT-4o, GPT-4.1, GPT-4o Mini, o3-mini
│       └── index.js         # Provider registry + factory
├── components/              # React UI components
├── context/                 # Auth context (Supabase)
├── pages/
│   └── LandingPage.jsx      # Marketing landing page
├── App.jsx                  # Main orchestrator
└── main.jsx                 # Entry point
cli/
├── index.js                 # CLI entry point (init, update, scan)
├── wizard.js                # 7-step interactive wizard
└── writer.js                # IDE-aware file writer with backups
```

## 📦 Tech Stack

- **React 18** — UI framework
- **Vite 6** — Build tool
- **Anthropic Claude + OpenAI GPT** — Multi-provider AI generation
- **Supabase** — Authentication + cloud storage
- **JSZip** — ZIP file generation for exports
- **Node.js readline** — CLI (zero external dependencies)
- **Deployed on Vercel** — [blueprint-compiler.vercel.app](https://blueprint-compiler.vercel.app)

## 🔒 Security

- **API keys** stored in `sessionStorage` — disappear when you close the tab
- **Direct API calls** — your key goes only to your chosen provider
- **Authentication** via Supabase (email + GitHub OAuth)
- **No analytics, no tracking, no cookies**

## 🛠️ Customization

### Add a new LLM provider

Create a new file in `src/engine/providers/` extending `BaseProvider`, add it to `index.js`.

### Add a new model

Edit `src/engine/providers/anthropic.js` or `openai.js` — add an entry to the `models` array.

### Add a new IDE target

Edit `src/data/constants.js` — add to the `IDE_TARGETS` array with correct file paths.

### Add a new Quick Start preset

Edit `src/data/presets.js` — add a new object with config.

## 📜 License

MIT — use it, modify it, ship it.

---

**Built with Context Engineering methodology.**
