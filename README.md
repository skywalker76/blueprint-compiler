# ⚡ Blueprint Compiler

Transform your project requirements into production-ready AI agent Blueprints.

A **Blueprint** is a set of configuration files that transforms a generic AI coding agent (like Google Antigravity) into a specialized architect that follows your exact stack, patterns, and quality standards.

## What it does

1. **Choose your domain** — SaaS, WordPress, E-commerce, Mobile, Data Platform, or Custom
2. **Configure your stack** — with guided explanations for every technology choice
3. **Define your project** — name, mission, languages, priorities
4. **Generate** — 5 production-ready files powered by Claude AI

### Generated files

| File | Layer | Purpose |
|------|-------|---------|
| `rules.md` | Layer 2 | Workspace rules — stack, architecture, conventions, security |
| `Skills` | Layer 3 | On-demand competencies with templates and constraints |
| `Workflows` | Layer 4 | Step-by-step procedures enforcing correct order |
| `Context` | Layer 5 | Architecture Decision Records + coding style |
| `PROMPT_START` | Entry | Bootstrap file with project overview and quick start |

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ installed
- An [Anthropic API key](https://console.anthropic.com/) (costs ~$0.15-0.25 per full Blueprint)

### Run locally

```bash
git clone https://github.com/skywalker76/blueprint-compiler.git
cd blueprint-compiler
npm install
npm run dev
```

Open `http://localhost:5173` and paste your Anthropic API key.

### Deploy to Vercel (recommended)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project" → select your repo
4. Click "Deploy" — no configuration needed
5. Your app is live at `your-project.vercel.app`

### Deploy to Netlify

1. Push this repo to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Select your repo
5. Build command: `npm run build`
6. Publish directory: `dist`
7. Click "Deploy"

### Deploy to GitHub Pages

```bash
npm run build
# Upload contents of dist/ folder to your GitHub Pages repo
```

## How it works

The app is a **100% client-side React application**. No backend, no server, no database.

- User enters their own Anthropic API key (stored in browser session only)
- API calls go directly from the browser to `api.anthropic.com`
- The Meta-Template (Context Engineering methodology) is embedded as the system prompt
- Each file is generated independently — you can regenerate any single file
- Nothing is stored permanently — refresh the page and start fresh

## Security

- **API keys** are stored in `sessionStorage` only — they disappear when you close the tab
- **No server** means no key can ever be leaked from a backend
- **Direct API calls** — your key goes only to Anthropic, nowhere else
- **No analytics, no tracking, no cookies**

## Customization

### Add a new domain

In `src/App.jsx`, add an entry to the `DOMAINS` array and a matching entry in `STACK_INFO`.

### Change the AI model

Search for `claude-sonnet-4-20250514` in `App.jsx` and replace with any Anthropic model.

### Update technology options

Each domain's stack categories are in `STACK_INFO`. Add/remove/edit options freely.

### Modify the system prompt

The `META_TEMPLATE_SYSTEM` constant at the top of `App.jsx` contains the Context Engineering methodology that guides generation quality.

## Tech Stack

- **React 18** — UI framework
- **Vite 6** — build tool (fast dev server, optimized builds)
- **Anthropic Claude API** — AI generation
- **Zero dependencies** beyond React — no UI libraries, no state management, no CSS frameworks

## License

MIT — use it, modify it, sell it, whatever you want.

---

Built with Context Engineering methodology.
