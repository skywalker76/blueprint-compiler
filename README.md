# ⚡ Blueprint Compiler v2.0

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React 18](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev)
[![Vite 6](https://img.shields.io/badge/Vite-6-646cff.svg)](https://vitejs.dev)
[![Multi-IDE](https://img.shields.io/badge/IDEs-4_Targets-fb923c.svg)](#supported-ides)

> Transform project requirements into production-ready AI agent Blueprints — for **4 IDEs**, with **agentic generation**, **quality scoring**, and **local persistence**.

---

## 🎯 What is a Blueprint?

A **Blueprint** is a set of configuration files that transforms a generic AI coding agent into a **specialized architect** that follows your exact stack, patterns, and quality standards.

Instead of repeating instructions every chat, your agent starts with deep knowledge of your project.

## ✨ What's New in v2.0

| Feature | v1.0 | v2.0 |
|---------|------|------|
| Architecture | Monolith (995 lines) | Modular (15+ files) |
| IDE Support | Antigravity only | **4 IDEs** |
| Generation | Single-shot | **Agentic loop** (Generate → Validate → Refine) |
| Quality | None | **0-100 scoring** with breakdown |
| Persistence | None | **Blueprint Library** (save/load/export) |
| Stack Detection | Manual | **Auto-detect** from package.json |
| Domains | 3 | **6** (SaaS, WordPress, E-commerce, Mobile, Data, Custom) |

## 🖥️ Supported IDEs

| IDE | Config Format | Status |
|-----|--------------|--------|
| 🔮 **Google Antigravity** | `.gemini/` | ✅ Full support |
| ⚡ **Cursor** | `.cursor/` | ✅ Full support |
| 🐙 **GitHub Copilot** | `.github/copilot/` | ✅ Full support |
| 🏄 **Windsurf** | `.windsurf/` | ✅ Full support |

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- An [Anthropic API key](https://console.anthropic.com/) (~$0.15-0.25 per full Blueprint)

### Run locally

```bash
git clone https://github.com/skywalker76/blueprint-compiler.git
cd blueprint-compiler
npm install
npm run dev
```

Open `http://localhost:5173` and paste your API key.

## 📋 5-Step Wizard

1. **🎯 Domain** — Choose from 6 project types (SaaS B2B, WordPress, E-commerce, Mobile, Data Platform, Custom)
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

## 🏗️ Architecture

```
src/
├── data/
│   ├── domains.js        # 6 project domains
│   ├── stacks.js         # Technology configurations
│   └── constants.js      # IDE targets, tiers, file types
├── engine/
│   ├── generator.js      # Agentic generation loop
│   ├── validator.js      # Quality scoring (0-100)
│   ├── scanner.js        # package.json auto-detect
│   └── persistence.js    # Blueprint Library (localStorage)
├── components/
│   ├── QualityScore.jsx  # Score visualization
│   ├── StepBar.jsx       # Wizard progress bar
│   ├── InfoBox.jsx       # Contextual help
│   ├── OptionGuide.jsx   # Technology explanations
│   ├── CopyButton.jsx    # One-click copy
│   └── SectionTitle.jsx  # Section headers
├── styles.js             # Design system
└── App.jsx               # Main orchestrator
```

## 🔒 Security

- **API keys** stored in `sessionStorage` — disappear when you close the tab
- **No backend** — no key leakage possible
- **Direct API calls** — your key goes only to Anthropic
- **No analytics, no tracking, no cookies**
- **Blueprints** saved in `localStorage` — never leave your browser

## 🛠️ Customization

### Add a new domain

Edit `src/data/domains.js` and add a matching entry in `src/data/stacks.js`.

### Add a new IDE target

Edit `src/data/constants.js` — add to the `IDE_TARGETS` array with the correct file paths.

### Change the AI model

Edit `src/engine/generator.js` — search for the model name and replace it.

## 📦 Tech Stack

- **React 18** — UI framework
- **Vite 6** — Build tool
- **Anthropic Claude API** — AI generation
- **Zero extra dependencies** — no UI libraries, no CSS frameworks

## 📜 License

MIT — use it, modify it, ship it.

---

**Built with Context Engineering methodology.**
