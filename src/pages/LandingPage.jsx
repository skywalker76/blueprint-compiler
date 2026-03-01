import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { openCheckout } from "../lib/lemonsqueezy";
import { BlueprintTabs } from "../components/BlueprintTabs.jsx";
import { DEMO_CONFIG, DEMO_GENERATED } from "../data/demoBlueprint.js";
import { DOMAINS } from "../data/domains.js";
import { IDE_TARGETS } from "../data/constants.js";
import "./LandingPage.css";

// ─── DATA ───
const FEATURES = [
  { icon: "🧠", title: "Anthropic Power", desc: "Powered by Anthropic's state-of-the-art models (Claude Opus 4.5, Claude 3.7 Sonnet, Haiku) for maximum coding capability.", color: "orange" },
  { icon: "📚", title: "Enterprise Skill Registry", desc: "Access a massively valuable repository of official, community-vetted architectural skills. Your AI injects exact, high-level standard operating procedures directly into your project, transforming it into an enterprise-grade architect.", color: "blue" },
  { icon: "🔍", title: "Project Scanner", desc: "Paste your package.json and AI auto-detects framework, ORM, DB, auth provider and pre-fills your entire config. Zero manual setup.", color: "green", badge: "PRO" },
  { icon: "🔄", title: "Update Mode", desc: "Changed your stack? Describe what changed and the AI intelligently updates your Blueprint — preserving what's still valid.", color: "purple" },
  { icon: "🎯", title: "4 IDE Targets", desc: "One wizard, four outputs. Antigravity, Cursor, GitHub Copilot, and Windsurf — each with native file structure.", color: "cyan" },
  { icon: "⚡", title: "40 Quick Start Presets", desc: "SaaS, CRM, AI Agent, Real-time Chat, Healthcare, Real Estate and more. Click a card → skip the wizard → generate instantly.", color: "orange" },
];

const STEPS_DATA = [
  { num: "1", title: "Choose Domain", desc: "SaaS, WordPress, E-commerce, Mobile, Data, or Custom" },
  { num: "2", title: "Select IDE", desc: "Antigravity, Cursor, Copilot, or Windsurf" },
  { num: "3", title: "Configure Stack", desc: "Framework, ORM, Auth, DB with guided explanations" },
  { num: "4", title: "Define Project", desc: "Name, mission, language, architecture priorities" },
  { num: "5", title: "Generate", desc: "5 production-ready files with quality scoring" },
];

const COMPARISON = [
  { feature: "LLM Support", before: "Claude 3 Sonnet", after: "Latest Anthropic Models (Opus, Sonnet, Haiku)" },
  { feature: "Interface", before: "Web only", after: "Web App + CLI" },
  { feature: "Stack Detection", before: "Manual input", after: "🔍 Auto-detect from package.json" },
  { feature: "Updates", before: "Regenerate all", after: "Smart Update Mode" },
  { feature: "IDE Support", before: "1 IDE", after: "4 IDEs" },
  { feature: "Generation", before: "Single-shot", after: "Agentic loop" },
  { feature: "Quick Start", before: "✕", after: "40 preset templates" },
  { feature: "Export", before: "Copy only", after: "JSON + YAML + ZIP" },
  { feature: "Architecture", before: "Monolith", after: "Modular (24 files)" },
];

const PRICING = [
  {
    tier: "Free",
    price: "$0",
    sub: "forever",
    features: ["3 blueprints / month", "1 IDE target", "Basic quality scoring", "Local storage only", "Community support"],
    cta: "Get Started",
    ctaStyle: "outline",
  },
  {
    tier: "Pro",
    price: "$19",
    sub: "per month",
    features: ["Unlimited blueprints", "All 4 IDE targets", "🔍 Project Scanner (auto-detect stack)", "Advanced quality scoring", "Cloud persistence", "Priority support", "Export ZIP / JSON"],
    cta: "Start Free Trial",
    ctaStyle: "primary",
    featured: true,
    badge: "Most Popular",
  },
  {
    tier: "Team",
    price: "$49",
    sub: "per month",
    features: ["Everything in Pro", "5 team members", "Shared blueprint library", "Custom templates", "API access", "SSO authentication"],
    cta: "Contact Sales",
    ctaStyle: "outline",
  },
];

// ─── LANDING PAGE ───
export default function LandingPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-scroll to hash anchor (e.g. #pricing) on load
  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [location.hash]);

  const handlePricingCta = async (tier) => {
    if (tier === "Free") {
      navigate("/app");
      return;
    }

    if (!user) {
      // Not logged in — send to app (which will show auth)
      navigate("/app");
      return;
    }

    const planKey = tier.toLowerCase(); // "pro" or "team"
    try {
      await openCheckout(planKey, user.email, user.id, async () => {
        // After successful checkout, refresh profile to get new tier
        await refreshProfile();
      });
    } catch (err) {
      console.error("Checkout error:", err);
    }
  };

  return (
    <div className="landing">

      {/* ━━━ Navbar ━━━ */}
      <nav className="nav">
        <div className="nav-inner">
          <Link to="/" className="nav-brand">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">Blueprint Compiler</span>
            <span className="version">v2.1</span>
          </Link>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#scanner" className="nav-link" style={{ color: "#6ee7b7" }}>🔍 Scanner</a>
            <a href="#how-it-works" className="nav-link">How It Works</a>
            <a href="#demo" className="nav-link">Demo</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="https://github.com/skywalker76/blueprint-compiler" target="_blank" rel="noreferrer" className="nav-link">GitHub</a>
            <a href="/docs.html" className="nav-link">📖 Docs</a>
            <Link to="/app" className="nav-link nav-cta">Launch App →</Link>
          </div>
        </div>
      </nav>

      {/* ━━━ Hero ━━━ */}
      <section className="hero">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />

        <div className="hero-badge">
          <span className="dot" />
          🚀 Open Beta — Full Access for Registered Users
        </div>

        <h1>
          Make Your AI Agent<br />
          <span className="gradient-text">10x Smarter</span>
        </h1>

        <p className="subtitle">
          An undeniable Architectural Standardization Engine. Stop repeating context. Generate enterprise-grade, production-ready Blueprints injected with
          <strong> Official Community Skills</strong>, powered by <strong>Anthropic Models</strong> —
          for Cursor, Antigravity, Copilot & Windsurf.
        </p>

        <div className="hero-actions">
          <Link to="/app" className="btn-primary">
            ⚡ Start Building — Free
          </Link>
          <a href="https://github.com/skywalker76/blueprint-compiler" target="_blank" rel="noreferrer" className="btn-secondary">
            ⭐ Star on GitHub
          </a>
        </div>

        <div className="hero-ides">
          <div className="ide-chip">🔮 Antigravity</div>
          <div className="ide-chip">⚡ Cursor</div>
          <div className="ide-chip">🐙 GitHub Copilot</div>
          <div className="ide-chip">🏄 Windsurf</div>
        </div>
      </section>

      {/* ━━━ Stats Bar ━━━ */}
      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-number">40</div>
          <div className="stat-label">Quick Start Presets</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">4</div>
          <div className="stat-label">IDE Targets</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">6</div>
          <div className="stat-label">Project Domains</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">3</div>
          <div className="stat-label">Export Formats</div>
        </div>
      </div>

      {/* ━━━ Features ━━━ */}
      <section className="section" id="features">
        <div className="section-label">Features</div>
        <h2>Everything You Need to<br />Build Better Agents</h2>
        <p className="section-desc">
          From auto-detection to our proprietary Enterprise Skill Registry — every feature is designed
          to produce standard-setting blueprints that elevate your AI agent from an assistant to a Senior Architect.
        </p>

        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div className="feature-card" key={i}>
              <div className={`feature-icon ${f.color}`}>{f.icon}</div>
              <h3>
                {f.title}
                {f.badge && <span className="feature-badge">{f.badge}</span>}
              </h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━ Scanner Spotlight ━━━ */}
      <section className="section scanner-spotlight" id="scanner">
        <div className="scanner-inner">
          <div className="scanner-text">
            <div className="section-label">🔍 Project Scanner</div>
            <h2>From <span className="gradient-text">package.json</span><br />to Full Blueprint in Seconds</h2>
            <p className="section-desc" style={{ textAlign: "left", maxWidth: 480 }}>
              Stop manually typing framework names. The Project Scanner reads your <code>package.json</code>,
              identifies your entire tech stack — framework, ORM, DB, auth, testing library — and
              auto-fills the entire Blueprint wizard. <strong>One paste. Zero guesswork.</strong>
            </p>
            <div className="scanner-benefits">
              <div className="scanner-benefit">
                <span className="benefit-icon">⚡</span>
                <div>
                  <strong>Instant Detection</strong>
                  <p>Identifies 30+ technologies from a single package.json</p>
                </div>
              </div>
              <div className="scanner-benefit">
                <span className="benefit-icon">🎯</span>
                <div>
                  <strong>Zero Manual Entry</strong>
                  <p>Framework, DB, ORM, auth, testing — all auto-filled</p>
                </div>
              </div>
              <div className="scanner-benefit">
                <span className="benefit-icon">📊</span>
                <div>
                  <strong>Confidence Scoring</strong>
                  <p>Each detection shows a % confidence so you know what was certain</p>
                </div>
              </div>
              <a href="/app" className="btn-primary" style={{ display: "inline-flex", marginTop: 24 }}>
                Try Scanner — Upgrade to Pro
              </a>
            </div>
            <div className="terminal-line"><span className="t-dim">$</span> <span className="t-cmd">blueprint-compiler scan package.json</span></div>
            <div className="terminal-line t-space"> </div>
            <div className="terminal-line"><span className="t-ok">✓</span> <span className="t-label">Framework:</span> <span className="t-val">Next.js App Router</span> <span className="t-conf">99%</span></div>
            <div className="terminal-line"><span className="t-ok">✓</span> <span className="t-label">Database:</span> <span className="t-val">PostgreSQL (Prisma)</span> <span className="t-conf">97%</span></div>
            <div className="terminal-line"><span className="t-ok">✓</span> <span className="t-label">Auth:</span> <span className="t-val">Supabase Auth</span> <span className="t-conf">95%</span></div>
            <div className="terminal-line"><span className="t-ok">✓</span> <span className="t-label">Styling:</span> <span className="t-val">Tailwind CSS</span> <span className="t-conf">100%</span></div>
            <div className="terminal-line"><span className="t-ok">✓</span> <span className="t-label">Testing:</span> <span className="t-val">Vitest + RTL</span> <span className="t-conf">94%</span></div>
            <div className="terminal-line"><span className="t-ok">✓</span> <span className="t-label">Deploy:</span> <span className="t-val">Vercel</span> <span className="t-conf">98%</span></div>
            <div className="terminal-line t-space"> </div>
            <div className="terminal-line"><span className="t-info">→</span> <span className="t-bright">Detected 6 technologies from 87 dependencies</span></div>
            <div className="terminal-line"><span className="t-info">→</span> <span className="t-bright">Blueprint wizard pre-filled. Ready to generate.</span></div>
            <div className="terminal-line t-space"> </div>
            <div className="terminal-line terminal-cursor"><span className="t-dim">$</span> <span className="cursor-blink">▋</span></div>
          </div>
        </div>
      </section>

      {/* ━━━ What It Is vs What It Isn't ━━━ */}
      <section className="section" id="what-it-does">
        <div className="section-label">Philosophy</div>
        <h2>Vibe Coding vs<br />Architectural Governance</h2>
        <p className="section-desc">
          The difference between a broken prototype and production-ready software.
        </p>

        <div style={{ display: 'flex', gap: 24, marginTop: 40, flexDirection: 'row', flexWrap: 'wrap', maxWidth: 900, margin: '40px auto 0' }}>
          <div style={{ flex: 1, minWidth: 300, background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 12, padding: 32, textAlign: 'left' }}>
            <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>❌</span> What it DOESN'T do<br /><span style={{ fontSize: 13, opacity: 0.8 }}>(Generic Vibe Coding)</span>
            </div>
            <ul style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.6, paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 12 }}>It doesn't write the app code directly for you.</li>
              <li style={{ marginBottom: 12 }}>It doesn't let the AI guess your architecture randomly.</li>
              <li>It doesn't produce bloated or non-standard code.</li>
            </ul>
          </div>

          <div style={{ flex: 1, minWidth: 300, background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: 12, padding: 32, textAlign: 'left' }}>
            <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>✅</span> What it DOES<br /><span style={{ fontSize: 13, opacity: 0.8 }}>(Architectural Governance)</span>
            </div>
            <ul style={{ color: '#e2e8f0', fontSize: 15, lineHeight: 1.6, paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 12 }}><strong>Instructs your AI IDE</strong> on the exact stack & rules to use.</li>
              <li style={{ marginBottom: 12 }}><strong>Forces Senior Dev standards</strong> before writing a single line of code.</li>
              <li><strong>Generates the rule files</strong> (.cursorrules, memory, workflows) that turn your AI into a 10x Architect.</li>
            </ul>
          </div>
        </div>

        {/* ═══ COMMUNITY FEEDBACK ═══ */}
        <div style={{ marginTop: 40, maxWidth: 900, margin: '40px auto 0', background: 'rgba(14, 165, 233, 0.05)', border: '1px solid rgba(14, 165, 233, 0.2)', borderRadius: 12, padding: 32, textAlign: 'left' }}>
          <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>💬</span> From the Community: Real-world results
          </div>
          <div style={{ color: '#cbd5e1', fontSize: 16, fontStyle: 'italic', lineHeight: 1.6, paddingLeft: 16, borderLeft: '3px solid #0ea5e9' }}>
            "It finally finished, <strong>I'm amazed by how it turned out...</strong> This project is incredible, especially for non-programmers. It's the difference between clumsy, raw vibe-coding and a truly mature product."
            <div style={{ marginTop: 12, fontSize: 14, color: '#64748b', fontStyle: 'normal' }}>
              — Andrea D. (Tested the <strong>React to WP</strong> preset on a real production app)
            </div>
          </div>
        </div>
      </section >

      {/* ━━━ CLI Spotlight ━━━ */}
      < section className="section cli-spotlight" id="cli" >
        <div className="cli-inner">
          <div className="cli-demo">
            <div className="mac-terminal">
              <div className="terminal-header">
                <div className="mac-dots">
                  <span className="dot-red"></span>
                  <span className="dot-yellow"></span>
                  <span className="dot-green"></span>
                </div>
                <span className="terminal-title">alex.dev@mbp: ~/projects/nova</span>
              </div>
              <div className="terminal-body" style={{ fontFamily: "var(--mono)", fontSize: "12px", lineHeight: "1.6", color: "#e2e8f0" }}>
                <div><span style={{ color: "#6ee7b7" }}>➜</span> <span style={{ color: "#7dd3fc", fontWeight: "bold" }}>nova</span> <span style={{ color: "#fb923c" }}>npx blueprint-compiler init</span></div>
                <br />
                <div><span style={{ color: "#94a3b8" }}>📦 Found package.json — auto-detecting stack...</span></div>
                <div><span style={{ color: "#6ee7b7" }}>✓ Detected: backend: Supabase (85% confidence)</span></div>
                <br />
                <div><span style={{ color: "#fb923c", fontWeight: "bold" }}>⚡ Blueprint Compiler CLI v2.1</span></div>
                <div><span style={{ color: "#94a3b8" }}>Transform requirements into production-ready AI agent Blueprints</span></div>
                <br />
                <div><span style={{ color: "#7dd3fc" }}>1/7</span> Select LLM Provider:</div>
                <div>  1) 🟠 Anthropic</div>
                <div><span style={{ color: "#6ee7b7" }}>→ Choose (1-1): 1</span></div>
                <br />
                <div><span style={{ color: "#7dd3fc" }}>2/7</span> Select Model:</div>
                <div>  1) Claude Opus 4.5 — Powerful, best for complex reasoning</div>
                <div>  2) Claude Sonnet 3.7 — Balanced and stable</div>
                <div>  3) Claude Haiku — Fast and cost-effective</div>
                <div><span style={{ color: "#6ee7b7" }}>→ Choose (1-3): 1</span></div>
                <br />
                <div><span style={{ color: "#7dd3fc" }}>3/7</span> Enter your Anthropic API key: <span style={{ color: "#fb923c" }}>sk-ant-api03-...W5dwAA</span></div>
                <div><span style={{ color: "#6ee7b7" }}>✓ Key format valid</span></div>
                <br />
                <div className="cursor-blink" style={{ display: "inline-block", width: "8px", height: "14px", backgroundColor: "#6ee7b7", verticalAlign: "middle" }}></div>
              </div>
            </div>
          </div>

          <div className="cli-text">
            <div className="section-label" style={{ color: "#7dd3fc" }}>🖥️ CLI Tool</div>
            <h2>Easy for Beginners. <br /><span className="gradient-text">Powerful for Pros.</span></h2>
            <p className="section-desc" style={{ textAlign: "left", maxWidth: 480 }}>
              Not a programmer? Using the terminal might seem scary, but it's just opening a window and typing <code>npx blueprint-compiler init</code>. We built a beautiful, step-by-step wizard that asks simple questions and automatically injects the perfect architecture directly into your folder. No coding required.
            </p>
            <div className="cli-benefits">
              <div className="cli-benefit">
                <span className="benefit-icon">🚀</span>
                <div>
                  <strong>Zero-Config Injection</strong>
                  <p>Automatically creates the <code>.cursor/rules</code> or <code>.windsurfrules</code> perfectly structured for your IDE.</p>
                </div>
              </div>
              <div className="cli-benefit">
                <span className="benefit-icon">🔄</span>
                <div>
                  <strong>Smart CLI Updates</strong>
                  <p>Added a new technology? Run <code>update</code>. The CLI intelligently patches your existing Blueprint.</p>
                </div>
              </div>
            </div>
            <a href="/docs.html#cli-tool" className="btn-secondary" style={{ display: "inline-flex", marginTop: 24, padding: "12px 24px" }}>
              📖 Read the Beginner's Guide
            </a>
          </div>
        </div>
      </section >

      {/* ━━━ How It Works ━━━ */}
      < section className="section" id="how-it-works" >
        <div className="section-label">How It Works</div>
        <h2>5 Steps to Production-Ready<br />AI Blueprints</h2>
        <p className="section-desc">
          A guided wizard that takes you from zero to a complete Blueprint in under 2 minutes.
        </p>

        <div className="steps-container">
          {STEPS_DATA.map((s, i) => (
            <div className="step-item" key={i}>
              <div className="step-number">{s.num}</div>
              <h4>{s.title}</h4>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section >

      {/* ━━━ Live Demo ━━━ */}
      < section className="section" id="demo" >
        <div className="section-label">Live Preview</div>
        <h2>See It In Action</h2>
        <p className="section-desc">
          This is a real Blueprint generated for a SaaS Task Manager.
          No API key required — explore all 5 layers below.
        </p>

        <div className="demo-wrapper">
          <BlueprintTabs
            generated={DEMO_GENERATED}
            config={DEMO_CONFIG}
            ideTarget="cursor"
            avgQuality={89}
            domain={DOMAINS.find(d => d.id === "saas")}
            currentIde={IDE_TARGETS.find(t => t.id === "cursor")}
            FILE_TYPES={[]}
            readOnly={true}
          />

          <div className="demo-cta-bar">
            <Link to="/app" className="btn-primary demo-cta-btn">
              ⚡ Generate Your Own — Free
            </Link>
            <span className="demo-cta-hint">No credit card · No API key required to explore presets</span>
          </div>
        </div>
      </section >

      {/* ━━━ v1 vs v2 Comparison ━━━ */}
      < section className="section" >
        <div className="section-label">Evolution</div>
        <h2>v1.0 vs v2.1 — A Quantum Leap</h2>
        <p className="section-desc">
          Blueprint Compiler v2.1 isn't an update — it's a complete rearchitecture.
        </p>

        <div className="comparison">
          <table>
            <thead>
              <tr>
                <th>Feature</th>
                <th>v1.0</th>
                <th>v2.1</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((c, i) => (
                <tr key={i}>
                  <td>{c.feature}</td>
                  <td className="cross">{c.before}</td>
                  <td className="highlight-col">{c.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section >

      {/* ━━━ Pricing ━━━ */}
      < section className="section" id="pricing" >
        <div className="section-label">Pricing</div>
        <h2>Simple, Transparent Pricing</h2>
        <p className="section-desc">
          Start free, upgrade when you need more power. No credit card required.
        </p>

        <div className="pricing-grid">
          {PRICING.map((p, i) => (
            <div className={`price-card${p.featured ? " featured" : ""}`} key={i}>
              {p.badge && <div className="price-badge">{p.badge}</div>}
              <div className="tier-name">{p.tier}</div>
              <div className="price">{p.price}</div>
              <div className="price-sub">{p.sub}</div>
              <ul className="price-features">
                {p.features.map((f, j) => (
                  <li key={j}>
                    <span className="check-icon">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handlePricingCta(p.tier)}
                className={`price-btn ${p.ctaStyle === "primary" ? "price-btn-primary" : "price-btn-outline"}`}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </section >

      {/* ━━━ Final CTA ━━━ */}
      < section className="cta-section" >
        <div className="cta-box">
          <h2>Ready to Build Smarter Agents?</h2>
          <p>
            Stop writing prompts from scratch. Generate production-ready Blueprints
            in under 2 minutes — for free.
          </p>
          <Link to="/app" className="btn-primary" style={{ display: "inline-flex" }}>
            ⚡ Launch Blueprint Compiler
          </Link>
        </div>
      </section >

      {/* ━━━ Footer ━━━ */}
      < footer className="footer" >
        <div className="footer-inner">
          <p>© 2026 Blueprint Compiler — Built with Context Engineering</p>
          <div className="footer-links">
            <a href="https://github.com/skywalker76/blueprint-compiler" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://github.com/skywalker76/blueprint-compiler/blob/master/LICENSE" target="_blank" rel="noreferrer">MIT License</a>
            <Link to="/app">Launch App</Link>
          </div>
          <div className="footer-links" style={{ marginTop: 8 }}>
            <a href="/privacy.html">Privacy Policy</a>
            <a href="/terms.html">Terms of Service</a>
            <a href="/cookies.html">Cookie Policy</a>
          </div>
        </div>
      </footer >
    </div >
  );
}
