import { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { openCheckout } from "../lib/lemonsqueezy";
import "./LandingPage.css";

// ─── DATA ───
const FEATURES = [
  { icon: "🧠", title: "Multi-Provider LLM", desc: "Choose Anthropic (Opus 4.6, Sonnet 4) or OpenAI (GPT-5.2, GPT-4o). Select the perfect model for your budget and quality needs.", color: "orange" },
  { icon: "🤖", title: "Agentic Generation", desc: "Generate → Validate → Score → Refine. An autonomous loop that iterates until quality exceeds your threshold.", color: "blue" },
  { icon: "⌨️", title: "CLI Tool", desc: "npx blueprint-compiler init — interactive terminal wizard. Auto-detects your stack from package.json. Zero config.", color: "green" },
  { icon: "🔄", title: "Update Mode", desc: "Changed your stack? Describe what changed and the AI intelligently updates your Blueprint — preserving what's still valid.", color: "purple" },
  { icon: "🎯", title: "4 IDE Targets", desc: "One wizard, four outputs. Antigravity, Cursor, GitHub Copilot, and Windsurf — each with native file structure.", color: "cyan" },
  { icon: "⚡", title: "30 Quick Start Presets", desc: "SaaS, CRM, AI Product, WordPress, Marketplace and more. Click a card → skip the wizard → generate instantly.", color: "orange" },
];

const STEPS_DATA = [
  { num: "1", title: "Choose Domain", desc: "SaaS, WordPress, E-commerce, Mobile, Data, or Custom" },
  { num: "2", title: "Select IDE", desc: "Antigravity, Cursor, Copilot, or Windsurf" },
  { num: "3", title: "Configure Stack", desc: "Framework, ORM, Auth, DB with guided explanations" },
  { num: "4", title: "Define Project", desc: "Name, mission, language, architecture priorities" },
  { num: "5", title: "Generate", desc: "5 production-ready files with quality scoring" },
];

const COMPARISON = [
  { feature: "LLM Support", before: "Claude only", after: "7 models (Anthropic + OpenAI)" },
  { feature: "Interface", before: "Web only", after: "Web App + CLI" },
  { feature: "Updates", before: "Regenerate all", after: "Smart Update Mode" },
  { feature: "IDE Support", before: "1 IDE", after: "4 IDEs" },
  { feature: "Generation", before: "Single-shot", after: "Agentic loop" },
  { feature: "Quick Start", before: "✕", after: "30 preset templates" },
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
    features: ["Unlimited blueprints", "All 4 IDE targets", "Advanced quality scoring", "Cloud persistence", "Priority support", "Export ZIP / JSON"],
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
            <a href="#how-it-works" className="nav-link">How It Works</a>
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
          Now with CLI + Multi-Provider LLM
        </div>

        <h1>
          Transform Ideas Into<br />
          <span className="gradient-text">AI Agent Blueprints</span>
        </h1>

        <p className="subtitle">
          Generate production-ready AI agent Blueprints with <strong>7 LLM models</strong>,
          a <strong>CLI tool</strong>, and <strong>smart Update Mode</strong> —
          for Antigravity, Cursor, Copilot & Windsurf.
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
          <div className="stat-number">30</div>
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
          From auto-detection to agentic refinement — every feature is designed
          to produce blueprints that actually make your AI agent smarter.
        </p>

        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div className="feature-card" key={i}>
              <div className={`feature-icon ${f.color}`}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━ How It Works ━━━ */}
      <section className="section" id="how-it-works">
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
      </section>

      {/* ━━━ v1 vs v2 Comparison ━━━ */}
      <section className="section">
        <div className="section-label">Evolution</div>
        <h2>v1.0 vs v2.0 — A Quantum Leap</h2>
        <p className="section-desc">
          Blueprint Compiler v2.0 isn't an update — it's a complete rearchitecture.
        </p>

        <div className="comparison">
          <table>
            <thead>
              <tr>
                <th>Feature</th>
                <th>v1.0</th>
                <th>v2.0</th>
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
      </section>

      {/* ━━━ Pricing ━━━ */}
      <section className="section" id="pricing">
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
      </section>

      {/* ━━━ Final CTA ━━━ */}
      <section className="cta-section">
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
      </section>

      {/* ━━━ Footer ━━━ */}
      <footer className="footer">
        <div className="footer-inner">
          <p>© 2026 Blueprint Compiler — Built with Context Engineering</p>
          <div className="footer-links">
            <a href="https://github.com/skywalker76/blueprint-compiler" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://github.com/skywalker76/blueprint-compiler/blob/master/LICENSE" target="_blank" rel="noreferrer">MIT License</a>
            <Link to="/app">Launch App</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
