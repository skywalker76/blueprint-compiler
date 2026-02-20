import { useState, useEffect, useRef } from "react";

// ─── Data ───
import { DOMAINS } from "./data/domains.js";
import { STACK_INFO } from "./data/stacks.js";
import { LANGUAGES, FILE_TYPES, IDE_TARGETS, TIERS, RIGOR_LEVELS } from "./data/constants.js";
import { GALLERY_BLUEPRINTS } from "./data/gallery.js";
import { PRESETS } from "./data/presets.js";

// ─── Engine ───
import { generateFile as engineGenerateFile, generateAll as engineGenerateAll, updateFile as engineUpdateFile } from "./engine/generator.js";
import { scanPackageJson } from "./engine/scanner.js";
import { PROVIDER_LIST, DEFAULT_PROVIDER, getProvider } from "./engine/providers/index.js";
import { saveBlueprint, loadLibrary, deleteBlueprint, exportAsZip, exportAsJson, exportAsYaml, getBlueprintJsonString, getBlueprintYamlString, getUsageCount, trackUsage, migrateLocalToCloud, getTelemetryPreference, setTelemetryPreference, trackAnonymousEvent } from "./engine/persistence.js";

// ─── Auth ───
import { useAuth } from "./context/AuthContext.jsx";
import { AuthModal } from "./components/AuthModal.jsx";
import { UpgradeModal } from "./components/UpgradeModal.jsx";

// ─── Components ───
import { InfoBox } from "./components/InfoBox.jsx";
import { BlueprintTabs } from "./components/BlueprintTabs.jsx";
import { QuickStartBar } from "./components/QuickStartBar.jsx";
import { FeedbackBar } from "./components/FeedbackBar.jsx";
import { OptionGuide } from "./components/OptionGuide.jsx";
import { CopyButton } from "./components/CopyButton.jsx";
import { StepBar } from "./components/StepBar.jsx";
import { SectionTitle } from "./components/SectionTitle.jsx";
import { QualityScore } from "./components/QualityScore.jsx";
import { SuccessToast } from "./components/SuccessToast.jsx";

// ─── Styles ───
import { S } from "./styles.js";

// ─── STEP NAMES ───
const STEPS = ["Domain", "IDE", "Stack", "Project", "Generate"];

// ─── MAIN APP ───
export default function App() {
  // ─── Auth ───
  const { user, profile, session, loading: authLoading, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(null); // null | { reason, data }

  // ─── State ───
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem("bc_api_key") || "");
  const [provider, setProvider] = useState(() => sessionStorage.getItem("bc_provider") || DEFAULT_PROVIDER);
  const [modelId, setModelId] = useState(() => sessionStorage.getItem("bc_model") || "");
  const [showKeyInfo, setShowKeyInfo] = useState(false);
  const [updateInput, setUpdateInput] = useState({}); // { [fileType]: "change description" }
  const [step, setStep] = useState(() => {
    try {
      const saved = localStorage.getItem("bc_wizard_step");
      return saved ? parseInt(saved, 10) : 0;
    } catch { return 0; }
  });
  const [config, setConfig] = useState(() => {
    const defaultConf = {
      domain: "", projectName: "", mission: "",
      langConvo: "it", langCode: "en",
      stack: {}, customDomain: "", customStack: "",
      priorities: ["performance", "security", "maintainability", "scalability"],
      rigor: "balanced",
    };
    try {
      const saved = localStorage.getItem("bc_wizard_config");
      return saved ? { ...defaultConf, ...JSON.parse(saved) } : defaultConf;
    } catch { return defaultConf; }
  });
  const [ideTarget, setIdeTarget] = useState(() => {
    try {
      return localStorage.getItem("bc_wizard_ide") || "antigravity";
    } catch { return "antigravity"; }
  });
  const [generated, setGenerated] = useState(() => {
    try {
      const saved = localStorage.getItem("bc_wizard_generated");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [generating, setGenerating] = useState(null);
  const [activeTab, setActiveTab] = useState("rules");
  const [error, setError] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerInput, setScannerInput] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [library, setLibrary] = useState([]);
  const [libraryTab, setLibraryTab] = useState("my"); // "my" | "gallery"
  const [telemetry, setTelemetry] = useState(getTelemetryPreference());
  const [generationProgress, setGenerationProgress] = useState(null); // { current, total, label }
  const [showSuccess, setShowSuccess] = useState(null); // null | { fileCount, totalLines, qualityScore }
  const resultRef = useRef(null);
  const libraryRef = useRef(null);

  // ─── Load library (async, depends on auth) ───
  useEffect(() => {
    if (authLoading) return;
    loadLibrary(user?.id).then(setLibrary).catch(console.error);
    if (getTelemetryPreference()) trackAnonymousEvent("app_loaded");
  }, [user, authLoading]);

  // ─── Auth diagnostics (console trace for systematic debugging) ───
  useEffect(() => {
    console.group("[Auth] State update");
    console.log("loading:", authLoading);
    console.log("user:", user ? `${user.email} (id: ${user.id})` : "null");
    console.log("session:", session ? `valid (expires: ${new Date(session.expires_at * 1000).toLocaleTimeString()})` : "null");
    console.log("profile tier:", profile?.tier ?? "(no profile)");
    console.groupEnd();
  }, [user, session, profile, authLoading]);

  // ─── Auto-migrate localStorage → Supabase on first login ───
  useEffect(() => {
    if (!user?.id) return;
    migrateLocalToCloud(user.id).then(({ migrated }) => {
      if (migrated > 0) {
        console.log(`Migrated ${migrated} blueprints to cloud`);
        loadLibrary(user.id).then(setLibrary);
      }
    });
  }, [user?.id]);

  // ─── Helpers ───
  const upd = (k, v) => setConfig(p => ({ ...p, [k]: v }));
  const domain = DOMAINS.find(d => d.id === config.domain);
  const stackInfo = STACK_INFO[config.domain] || { intro: "", categories: [] };
  const currentIde = IDE_TARGETS.find(t => t.id === ideTarget) || IDE_TARGETS[0];

  // Save API key + provider + model to session
  useEffect(() => {
    if (apiKey) sessionStorage.setItem("bc_api_key", apiKey);
    sessionStorage.setItem("bc_provider", provider);
    if (modelId) sessionStorage.setItem("bc_model", modelId);
  }, [apiKey, provider, modelId]);

  // Save Wizard State to localStorage (Autosave)
  useEffect(() => {
    try {
      localStorage.setItem("bc_wizard_step", step);
      localStorage.setItem("bc_wizard_config", JSON.stringify(config));
      localStorage.setItem("bc_wizard_ide", ideTarget);
      localStorage.setItem("bc_wizard_generated", JSON.stringify(generated));
    } catch (e) { console.warn("Failed to save wizard state to localStorage", e); }
  }, [step, config, ideTarget, generated]);

  // Initialize stack when domain changes
  useEffect(() => {
    if (config.domain && config.domain !== "custom") {
      const d = {};
      stackInfo.categories.forEach(c => { d[c.key] = c.options[c.default].value; });
      upd("stack", d);
    }
  }, [config.domain]);

  // ─── Scanner ───
  const handleScan = () => {
    const result = scanPackageJson(scannerInput);
    setScanResult(result);
    if (result.success) {
      // Apply detected values
      if (result.domain) upd("domain", result.domain);
      if (result.projectName) upd("projectName", result.projectName);
      if (result.description) upd("mission", result.description);
      // Apply detected stack
      if (Object.keys(result.detected).length > 0) {
        const newStack = { ...config.stack };
        for (const [key, det] of Object.entries(result.detected)) {
          newStack[key] = det.value;
        }
        upd("stack", newStack);
      }
    }
  };

  // ─── Tier helpers ───
  const userTier = profile?.tier || "free";
  const tierLimits = TIERS[userTier] || TIERS.free;

  // ─── Generation (Agentic) ───
  const handleGenerateFile = async (fileType, isGenerateAll = false) => {
    // Gate 1: Login obbligatorio
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Gate 2: Limite mensile (solo per tier con limiti, e solo se non è parte di Generate All)
    if (!isGenerateAll && tierLimits.maxGenerations !== Infinity) {
      const count = await getUsageCount(user.id);
      if (count >= tierLimits.maxGenerations) {
        setShowUpgradeModal({ reason: "generation_limit", data: { count, max: tierLimits.maxGenerations } });
        return;
      }
    }

    if (!apiKey) { setError("Please enter your API key first"); return; }
    setGenerating(fileType);
    setError(null);
    setActiveTab(fileType);
    try {
      const result = await engineGenerateFile(fileType, apiKey, config, ideTarget, (progress) => {
        setGenerating(`${fileType} (${progress.phase})`);
      }, provider, modelId || getProvider(provider).defaultModel);
      setGenerated(p => ({ ...p, [fileType]: result }));
    } catch (err) {
      setError(`${fileType}: ${err.message}`);
    }
    setGenerating(null);
    if (!isGenerateAll) {
      trackAnonymousEvent("generate_file", { fileType });
      // Usage is tracked here when generating a single file, handled at start of handleGenerateAll otherwise
      try { await trackUsage(user?.id, "generate", { fileType }); } catch (_) { /* non-blocking */ }
    }
  };

  // ─── Update Mode ───
  const handleUpdateFile = async (fileType) => {
    const changeDesc = updateInput[fileType];
    if (!changeDesc?.trim()) { setError("Please describe what changed"); return; }
    const existing = generated[fileType]?.output;
    if (!existing) { setError("No existing file to update — generate first"); return; }
    if (!user) { setShowAuthModal(true); return; }
    if (!apiKey) { setError("Please enter your API key first"); return; }
    setGenerating(fileType);
    setError(null);
    setActiveTab(fileType);
    try {
      const result = await engineUpdateFile(fileType, apiKey, config, ideTarget, existing, changeDesc, (progress) => {
        setGenerating(`${fileType} (${progress.phase})`);
      }, provider, modelId || getProvider(provider).defaultModel);
      setGenerated(p => ({ ...p, [fileType]: result }));
      setUpdateInput(p => ({ ...p, [fileType]: "" }));
    } catch (err) {
      setError(`Update ${fileType}: ${err.message}`);
    }
    setGenerating(null);
    trackAnonymousEvent("update_file", { fileType });
  };

  const handleGenerateAll = async () => {
    // Gate 1: Login obbligatorio
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      // Gate 2: Limite mensile
      if (tierLimits.maxGenerations !== Infinity) {
        const count = await getUsageCount(user.id);
        if (count >= tierLimits.maxGenerations) {
          setShowUpgradeModal({ reason: "generation_limit", data: { count, max: tierLimits.maxGenerations } });
          return;
        }
      }

      if (!apiKey) { setError("Please enter your API key first"); return; }
      setError(null);
      setGenerationProgress({ current: 0, total: FILE_TYPES.length, label: "Starting..." });

      // Track usage BEFORE calling Claude API (costs money)
      try { await trackUsage(user.id, "generate", { fileType: "all" }); } catch (_) { /* non-blocking */ }

      for (let i = 0; i < FILE_TYPES.length; i++) {
        const ft = FILE_TYPES[i];
        setGenerationProgress({ current: i + 1, total: FILE_TYPES.length, label: ft.label });
        await handleGenerateFile(ft.id, true);
      }
      setGenerationProgress(null);

      // Calculate stats for success toast
      const finalGenerated = { ...generated };
      // Need a small timeout to let state settle
      setTimeout(() => {
        const fileCount = Object.values(finalGenerated).filter(r => r?.output).length;
        const totalLines = Object.values(finalGenerated)
          .filter(r => r?.output && typeof r.output === "string")
          .reduce((sum, r) => sum + r.output.split("\n").length, 0);
        const scores = Object.values(finalGenerated).filter(r => r?.quality?.score).map(r => r.quality.score);
        const avgQ = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
        setShowSuccess({ fileCount: fileCount || FILE_TYPES.length, totalLines: totalLines || 0, qualityScore: avgQ });
      }, 100);

      resultRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      setError(`Generation failed: ${err.message}`);
      setGenerationProgress(null);
    }
  };

  // ─── Persistence ───
  const [saveStatus, setSaveStatus] = useState(null); // "saving" | "saved" | "error" | null
  const handleSave = async () => {
    if (!generated || Object.keys(generated).length === 0) {
      setError("Nothing to save. Generate a blueprint first.");
      return;
    }
    setSaveStatus("saving");
    const bp = {
      id: config.projectName + "-" + Date.now().toString(36),
      config: { ...config },
      ideTarget,
      generated: { ...generated },
    };
    try {
      const result = await saveBlueprint(bp, user?.id);
      if (result.success) {
        const updated = await loadLibrary(user?.id);
        setLibrary(updated);
        setError(null);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setError(result.error || "Save failed");
        setSaveStatus("error");
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (err) {
      setError(`Save failed: ${err.message}`);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleLoadBlueprint = (bp) => {
    setConfig(bp.config);
    setIdeTarget(bp.ideTarget || "antigravity");
    setGenerated(bp.generated || {});
    setShowLibrary(false);
    setStep(4); // Go to Generate step
  };

  const handleDeleteBlueprint = async (id) => {
    try {
      const updated = await deleteBlueprint(id, user?.id);
      setLibrary(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  // ─── Quick Start Preset ───
  const handlePresetSelect = (preset) => {
    setConfig({ ...preset.config });
    setIdeTarget(preset.ideTarget);
    setGenerated({});
    setStep(4);
  };

  // ─── Priority reorder ───
  const movePriority = (i, d) => {
    const a = [...config.priorities];
    const n = i + d;
    if (n < 0 || n >= a.length) return;
    [a[i], a[n]] = [a[n], a[i]];
    upd("priorities", a);
  };

  // ─── Navigation guards ───
  const canProceed = [
    () => !!config.domain,                  // Step 0: Domain
    () => !!ideTarget,                       // Step 1: IDE
    () => true,                              // Step 2: Stack
    () => config.projectName.length > 2 && config.mission.length > 20, // Step 3: Project
    () => true,                              // Step 4: Generate
  ];

  // ─── Average quality score ───
  const avgQuality = () => {
    const scores = Object.values(generated).filter(r => r?.quality?.score).map(r => r.quality.score);
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1a", color: "#e2e8f0" }}>
      {/* ═══ TOP NAV ═══ */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(10,15,26,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid #1e293b", padding: "6px 12px", minHeight: 48, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
        <a href="/" style={{ fontSize: 14, fontWeight: 800, color: "#fb923c", letterSpacing: 0.5, textDecoration: "none" }}>⚡ Blueprint Compiler <span style={{ fontSize: 10, color: "#475569", fontWeight: 400 }}>v2.0</span></a>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <a href="/" style={{ fontSize: 12, color: "#94a3b8", textDecoration: "none", fontWeight: 500 }}>🏠 Home</a>
          <button onClick={() => { const willShow = !showLibrary; setShowLibrary(willShow); if (willShow) setTimeout(() => libraryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100); }} style={{ background: "none", border: "1px solid #334155", borderRadius: 6, color: "#94a3b8", cursor: "pointer", padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>
            📁 Library ({library.length})
          </button>

          <button onClick={() => {
            if (confirm("Are you sure you want to clear your current progress and start over?")) {
              localStorage.removeItem("bc_wizard_config");
              localStorage.removeItem("bc_wizard_step");
              localStorage.removeItem("bc_wizard_ide");
              localStorage.removeItem("bc_wizard_generated");
              window.location.reload();
            }
          }} style={{ background: "none", border: "1px dashed #334155", borderRadius: 6, color: "#cbd5e1", cursor: "pointer", padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>
            🔄 Reset
          </button>
          {user && (!profile?.tier || profile?.tier === "free") && (
            <a href="/#pricing" style={{ fontSize: 12, color: "#fb923c", textDecoration: "none", fontWeight: 700, background: "linear-gradient(135deg, #fb923c22, #f9731622)", padding: "4px 12px", borderRadius: 6, border: "1px solid #fb923c44" }}>⚡ Upgrade</a>
          )}
          <a href="/docs.html" style={{ fontSize: 12, color: "#94a3b8", textDecoration: "none", fontWeight: 500 }}>📖 Docs</a>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "#64748b" }}>{user.email?.split("@")[0]}</span>
              <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: profile?.tier === "pro" ? "#f59e0b" : profile?.tier === "team" ? "#8b5cf6" : "#334155", color: "#fff", fontWeight: 700, textTransform: "uppercase" }}>{profile?.tier || "free"}</span>
              <button onClick={() => { signOut().then(() => { window.location.href = '/'; }).catch(err => { console.warn('Logout error:', err); window.location.href = '/'; }); }} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, color: "#f87171", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: "6px 14px", minHeight: 36, minWidth: 44 }}>Logout</button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} style={{ background: "linear-gradient(135deg, #fb923c, #f97316)", border: "none", borderRadius: 6, color: "#0a0f1a", cursor: "pointer", padding: "4px 14px", fontSize: 12, fontWeight: 700 }}>Sign In</button>
          )}
        </div>
      </nav>
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showUpgradeModal && <UpgradeModal reason={showUpgradeModal.reason} data={showUpgradeModal.data} onClose={() => setShowUpgradeModal(null)} />}
      {showSuccess && (
        <SuccessToast
          fileCount={showSuccess.fileCount}
          totalLines={showSuccess.totalLines}
          qualityScore={showSuccess.qualityScore}
          onDismiss={() => setShowSuccess(null)}
        />
      )}

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 16px" }}>
        {/* ═══ HEADER ═══ */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fb923c", margin: 0 }}>⚡ Blueprint Compiler</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "6px 0 0" }}>Transform project requirements into production-ready AI agent Blueprints</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 10 }}>
            {IDE_TARGETS.map(t => (
              <span key={t.id} style={{ ...S.badge(ideTarget === t.id), fontSize: 10 }}>{t.icon} {t.name}</span>
            ))}
          </div>
        </div>

        <InfoBox type="info">
          A <strong>Blueprint</strong> is a set of configuration files that transforms a generic AI agent into a specialized architect for YOUR project.
          Now supporting <strong>4 IDEs</strong>: Antigravity, Cursor, GitHub Copilot, and Windsurf.
        </InfoBox>

        {/* ═══ QUICK START ═══ */}
        {step === 0 && Object.keys(generated).length === 0 && (
          <QuickStartBar presets={PRESETS} onSelect={handlePresetSelect} />
        )}

        {/* ═══ LIBRARY PANEL ═══ */}
        {showLibrary && (
          <div ref={libraryRef} style={{ ...S.card, borderColor: "#334155", scrollMarginTop: 64 }}>
            <SectionTitle icon="📁" title="Blueprint Library" subtitle={libraryTab === "my" ? `${library.length} saved blueprint(s)` : "Community & Official Blueprints"} />

            <div style={{ display: "flex", gap: 16, marginBottom: 16, borderBottom: "1px solid #334155", paddingBottom: 0 }}>
              <button onClick={() => setLibraryTab("my")} style={{ paddingBottom: 8, background: "none", border: "none", borderBottom: libraryTab === "my" ? "2px solid #fb923c" : "2px solid transparent", color: libraryTab === "my" ? "#fb923c" : "#64748b", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>My Blueprints</button>
              <button onClick={() => setLibraryTab("gallery")} style={{ paddingBottom: 8, background: "none", border: "none", borderBottom: libraryTab === "gallery" ? "2px solid #fb923c" : "2px solid transparent", color: libraryTab === "gallery" ? "#fb923c" : "#64748b", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Community Gallery</button>
            </div>

            {libraryTab === "my" ? (
              library.length === 0 ? (
                <p style={{ fontSize: 13, color: "#475569", textAlign: "center", padding: 20 }}>No saved blueprints yet. Generate one and click "Save".</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {library.map(bp => (
                    <div key={bp.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#0f172a", borderRadius: 8, border: "1px solid #1e293b" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{bp.config?.projectName || "Untitled"}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {bp.config?.domain} · {bp.ideTarget || "antigravity"} · {new Date(bp.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button onClick={() => handleLoadBlueprint(bp)} style={S.btn(true, false)}>Load</button>
                      <button onClick={() => exportAsJson(bp)} style={S.btn(false, false)}>JSON</button>
                      <button onClick={() => handleDeleteBlueprint(bp.id)} style={{ ...S.btn(false, false), color: "#ef4444" }}>✕</button>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {GALLERY_BLUEPRINTS.map(bp => (
                  <div key={bp.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#0f172a", borderRadius: 8, border: "1px solid #1e293b" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{bp.config?.projectName}</div>
                        {bp.isOfficial && <span style={{ fontSize: 9, background: "#065f46", color: "#6ee7b7", padding: "1px 4px", borderRadius: 4, fontWeight: 700 }}>OFFICIAL</span>}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 4px" }}>{bp.config?.mission}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        {bp.config?.domain} · {bp.ideTarget} · by {bp.author} · Quality: {bp.quality?.score}%
                      </div>
                    </div>
                    <button onClick={() => handleLoadBlueprint(bp)} style={S.btn(true, false)}>Clone</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ API KEY BAR ═══ */}
        <div style={{ ...S.card, padding: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Provider Selector */}
          <select value={provider} onChange={e => { setProvider(e.target.value); setApiKey(""); setModelId(""); }}
            style={{ ...S.input, width: "auto", minWidth: 150, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
            {PROVIDER_LIST.map(p => (
              <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
            ))}
          </select>
          {/* Model Selector */}
          <select value={modelId || getProvider(provider).defaultModel} onChange={e => setModelId(e.target.value)}
            style={{ ...S.input, width: "auto", minWidth: 160, fontSize: 12, cursor: "pointer" }}>
            {getProvider(provider).models.map(m => (
              <option key={m.id} value={m.id}>{m.name} — {m.description}</option>
            ))}
          </select>
          <span style={{ fontSize: 13, color: "#64748b", whiteSpace: "nowrap" }}>🔑</span>
          <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
            placeholder={getProvider(provider).keyPlaceholder} style={{ ...S.input, flex: 1, minWidth: 180, fontSize: 13 }} />
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
                <strong>How to get your {getProvider(provider).name} API key:</strong><br />
                1. Go to <a href={getProvider(provider).keyHelpUrl} target="_blank" rel="noreferrer" style={{ color: "#fb923c" }}><strong>{getProvider(provider).keyHelpUrl.replace("https://", "")}</strong></a><br />
                2. Sign up or log in<br />
                3. Navigate to API Keys section<br />
                4. Create a new key and copy it<br />
                5. Paste it above — it stays in your browser only (session storage), never sent to any server except the provider's API directly.<br /><br />
                <strong>Cost:</strong> Each Blueprint generation costs approximately $0.02-0.05 (a few cents). A full Blueprint (all 5 files) costs about $0.15-0.25.
              </InfoBox>
            </div>
          )}
        </div>

        {/* ═══ PROJECT SCANNER ═══ */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <button onClick={() => {
            if (!tierLimits.hasScanner) {
              setShowUpgradeModal({ reason: "scanner_locked", data: {} });
              return;
            }
            setShowScanner(!showScanner);
          }}
            style={{ background: "none", border: "1px dashed #334155", borderRadius: 8, color: "#64748b", cursor: "pointer", padding: "8px 20px", fontSize: 12, fontWeight: 600, transition: "all .2s", position: "relative" }}>
            {showScanner ? "✕ Close Scanner" : "🔍 Auto-detect stack from package.json"}
            {!tierLimits.hasScanner && <span style={{ fontSize: 9, background: "linear-gradient(135deg, #f59e0b, #fb923c)", color: "#0a0f1a", padding: "1px 5px", borderRadius: 4, fontWeight: 800, marginLeft: 6 }}>PRO</span>}
          </button>
        </div>
        {showScanner && (
          <div style={{ ...S.card, borderColor: "#0c4a6e55", background: "#0c192988" }}>
            <SectionTitle icon="🔍" title="Project Scanner" subtitle="Paste your package.json — we'll auto-detect your stack" />
            <textarea style={{ ...S.textarea, minHeight: 150, fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}
              value={scannerInput} onChange={e => setScannerInput(e.target.value)}
              placeholder='Paste the contents of your package.json here...' />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <button onClick={handleScan} style={S.btn(true, !scannerInput)} disabled={!scannerInput}>
                ⚡ Analyze
              </button>
            </div>
            {scanResult && (
              <div style={{ marginTop: 12 }}>
                {scanResult.success ? (
                  <div>
                    <InfoBox type="success">
                      <strong>Detected {Object.keys(scanResult.detected).length} technologies</strong> from {scanResult.totalDeps} dependencies
                      {scanResult.domain && <> · Domain: <strong>{scanResult.domain}</strong></>}
                      {scanResult.projectName && <> · Project: <strong>{scanResult.projectName}</strong></>}
                    </InfoBox>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                      {Object.entries(scanResult.detected).map(([cat, det]) => (
                        <span key={cat} style={S.tag}>
                          ⚡ {cat}: {det.value} ({det.confidence}%)
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <InfoBox type="warn">{scanResult.error}</InfoBox>
                )}
              </div>
            )}
          </div>
        )}

        <StepBar steps={STEPS} current={step} />

        {/* ═══════════════════════════════════════════ */}
        {/* ═══ STEP 0: DOMAIN ═══ */}
        {/* ═══════════════════════════════════════════ */}
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
                      placeholder={"Example:\n- Frontend: Next.js 15\n- Backend: Node.js with Fastify\n- Database: TimescaleDB"} />
                  </div>
                )}
              </div>
            )}
            <div style={S.nav}>
              <div />
              <button style={S.btn(true, !canProceed[0]())} onClick={() => canProceed[0]() && setStep(1)}>Select IDE →</button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* ═══ STEP 1: IDE TARGET (NEW) ═══ */}
        {/* ═══════════════════════════════════════════ */}
        {step === 1 && (
          <div style={S.card}>
            <SectionTitle icon="🖥️" title="Choose Your IDE" subtitle="Blueprint files will be formatted for your IDE's specific configuration system" />
            <InfoBox type="info">
              Each IDE has its own configuration format and directory structure. Your Blueprint will be tailored for optimal integration with the selected IDE.
            </InfoBox>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
              {IDE_TARGETS.map(ide => {
                const isLocked = !tierLimits.ideTargets.includes(ide.id);
                return (
                  <div key={ide.id} onClick={() => {
                    if (isLocked) {
                      setShowUpgradeModal({ reason: "ide_locked", data: {} });
                      return;
                    }
                    setIdeTarget(ide.id);
                  }} style={{
                    padding: 18, borderRadius: 10, cursor: isLocked ? "not-allowed" : "pointer", transition: "all 0.2s",
                    border: ideTarget === ide.id ? "2px solid #fb923c" : "2px solid #1e293b",
                    background: ideTarget === ide.id ? "#1c1208" : "#0f172a",
                    opacity: isLocked ? 0.5 : 1, position: "relative",
                  }}>
                    {isLocked && <span style={{ position: "absolute", top: 8, right: 8, fontSize: 9, background: "linear-gradient(135deg, #f59e0b, #fb923c)", color: "#0a0f1a", padding: "2px 6px", borderRadius: 4, fontWeight: 800 }}>PRO</span>}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 28 }}>{isLocked ? "🔒" : ide.icon}</span>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: ideTarget === ide.id ? "#fb923c" : "#e2e8f0" }}>{ide.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{ide.shortDesc}</div>
                      </div>
                    </div>
                    {ideTarget === ide.id && !isLocked && (
                      <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, marginTop: 8, paddingTop: 8, borderTop: "1px solid #1e293b" }}>
                        {ide.guide}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {ideTarget && (
              <div style={{ marginTop: 16, padding: 14, background: "#0c192988", borderRadius: 8, border: "1px solid #1e3a5f" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#7dd3fc", marginBottom: 8 }}>📂 Output File Paths for {currentIde.name}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}>
                  <span style={{ color: "#475569" }}>Rules:</span><span style={{ color: "#e2e8f0" }}>{currentIde.rulesPath}</span>
                  <span style={{ color: "#475569" }}>Skills:</span><span style={{ color: "#e2e8f0" }}>{currentIde.skillsPath}</span>
                  <span style={{ color: "#475569" }}>Workflows:</span><span style={{ color: "#e2e8f0" }}>{currentIde.workflowsPath}</span>
                  <span style={{ color: "#475569" }}>Context:</span><span style={{ color: "#e2e8f0" }}>{currentIde.contextPath}</span>
                  <span style={{ color: "#475569" }}>Entry:</span><span style={{ color: "#e2e8f0" }}>{currentIde.promptPath}</span>
                </div>
              </div>
            )}
            <div style={S.nav}>
              <button style={S.btn(false)} onClick={() => setStep(0)}>← Domain</button>
              <button style={S.btn(true)} onClick={() => setStep(2)}>Configure Stack →</button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* ═══ STEP 2: STACK ═══ */}
        {/* ═══════════════════════════════════════════ */}
        {step === 2 && (
          <div style={S.card}>
            <SectionTitle icon={domain?.icon} title={`${domain?.name} — Technology Stack`} subtitle="Defaults are battle-tested — change only with a clear reason." />
            <InfoBox type="info">{stackInfo.intro}</InfoBox>
            {config.domain === "custom" ? (
              <InfoBox type="tip">Your custom stack was defined in the previous step. Proceed to project details.</InfoBox>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 8 }}>
                {stackInfo.categories.map(cat => {
                  const selectedOpt = cat.options.find(o => o.value === config.stack[cat.key]);
                  const isAutoDetected = scanResult?.detected?.[cat.key]?.value === config.stack[cat.key];
                  return (
                    <div key={cat.key} style={{ padding: 16, background: "#0f172a", borderRadius: 10, border: `1px solid ${isAutoDetected ? "#065f4655" : "#1e293b"}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <label style={{ ...S.label, margin: 0, flex: 1 }}>{cat.label}</label>
                        {isAutoDetected && <span style={S.tag}>⚡ Auto-detected</span>}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, lineHeight: 1.5 }}>{cat.why}</div>
                      <select style={{ ...S.input, cursor: "pointer" }} value={config.stack[cat.key] || ""}
                        onChange={e => upd("stack", { ...config.stack, [cat.key]: e.target.value })}>
                        {cat.options.map(o => <option key={o.value} value={o.value}>{o.value}</option>)}
                      </select>
                      <OptionGuide guide={selectedOpt?.guide} visible={!!selectedOpt} />
                    </div>
                  );
                })}
              </div>
            )}
            <div style={S.nav}>
              <button style={S.btn(false)} onClick={() => setStep(1)}>← IDE</button>
              <button style={S.btn(true)} onClick={() => setStep(3)}>Project Details →</button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* ═══ STEP 3: PROJECT DETAILS ═══ */}
        {/* ═══════════════════════════════════════════ */}
        {step === 3 && (
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
                  <select style={{ ...S.input, cursor: "pointer" }} value={config.langConvo} onChange={e => upd("langConvo", e.target.value)}>
                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Code Language</label>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>Language for code, comments, commits. English recommended.</div>
                  <select style={{ ...S.input, cursor: "pointer" }} value={config.langCode} onChange={e => upd("langCode", e.target.value)}>
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
              <div>
                <label style={S.label}>Blueprint Rigor</label>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>Controls planning depth, test coverage, and security requirements in generated Blueprints.</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {RIGOR_LEVELS.map(r => (
                    <button key={r.id}
                      onClick={() => upd("rigor", r.id)}
                      style={{
                        padding: "14px 12px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                        background: config.rigor === r.id ? "#1e293b" : "#0f172a",
                        border: `2px solid ${config.rigor === r.id ? (r.id === "strict" ? "#3b82f6" : r.id === "rapid" ? "#f59e0b" : "#fb923c") : "#1e293b"}`,
                        transition: "all 0.2s",
                      }}>
                      <div style={{ fontSize: 16, marginBottom: 4 }}>{r.label}</div>
                      <div style={{ fontSize: 11, color: config.rigor === r.id ? "#e2e8f0" : "#64748b", fontWeight: 600, marginBottom: 4 }}>{r.name}</div>
                      <div style={{ fontSize: 10, color: "#475569", lineHeight: 1.4 }}>{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={S.nav}>
              <button style={S.btn(false)} onClick={() => setStep(2)}>← Stack</button>
              <button style={S.btn(true, !canProceed[3]())} onClick={() => canProceed[3]() && setStep(4)}>Review & Generate →</button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* ═══ STEP 4: GENERATE & REVIEW ═══ */}
        {/* ═══════════════════════════════════════════ */}
        {step === 4 && (
          <>
            {/* Review Panel */}
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
                  <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", marginTop: 6 }}>
                    <span style={S.badge(true)}>{currentIde.icon} {currentIde.name}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>Priorities: {config.priorities.join(" > ")}</div>
                  <div style={{ marginTop: 4 }}><span style={{ ...S.badge(true), background: config.rigor === "strict" ? "#1e3a5f" : config.rigor === "rapid" ? "#422006" : "#3b1a08" }}>{RIGOR_LEVELS.find(r => r.id === config.rigor)?.label} {RIGOR_LEVELS.find(r => r.id === config.rigor)?.name}</span></div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 16 }}>
                {Object.entries(config.stack).map(([k, v]) => (
                  <div key={k} style={{ padding: "6px 10px", background: "#0f172a", borderRadius: 6, fontSize: 11 }}>
                    <span style={{ color: "#475569" }}>{k}: </span><span style={{ color: "#e2e8f0", fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
              {!apiKey && <InfoBox type="warn">You need to enter your API key above before generating.</InfoBox>}
              <div style={S.nav}>
                <button style={S.btn(false)} onClick={() => setStep(3)}>← Edit</button>
                <div style={{ display: "flex", gap: 8 }}>
                  {Object.keys(generated).length > 0 && (
                    <button style={{ ...S.btn(false), ...(saveStatus === "saved" ? { borderColor: "#22c55e", color: "#22c55e" } : saveStatus === "error" ? { borderColor: "#ef4444", color: "#ef4444" } : saveStatus === "saving" ? { opacity: 0.7 } : {}) }} onClick={handleSave} disabled={saveStatus === "saving"}>{saveStatus === "saving" ? "⏳ Saving..." : saveStatus === "saved" ? "✅ Saved!" : saveStatus === "error" ? "❌ Error" : "💾 Save"}</button>
                  )}
                  <button style={S.btn(true, !!generating || !apiKey)} onClick={handleGenerateAll} disabled={!!generating || !apiKey}>
                    {generating ? `⏳ ${generating}...` : "⚡ Generate All Blueprint Files"}
                  </button>
                </div>
              </div>

              {/* Progress Bar for Generate All */}
              {generationProgress && (
                <div style={{ marginTop: 12, padding: "12px 16px", background: "#0c1929", borderRadius: 10, border: "1px solid #1e3a5f" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#7dd3fc" }}>
                      ⚡ Generating {generationProgress.label}...
                    </span>
                    <span style={{ fontSize: 11, color: "#64748b" }}>
                      {generationProgress.current}/{generationProgress.total} files
                    </span>
                  </div>
                  <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${(generationProgress.current / generationProgress.total) * 100}%`,
                      background: "linear-gradient(90deg, #fb923c, #f97316, #ef4444)",
                      borderRadius: 3,
                      transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: "0 0 10px #fb923c66",
                    }} />
                  </div>
                </div>
              )}
            </div>

            {/* Overall Quality Score */}
            {avgQuality() !== null && (
              <div style={{ ...S.card, borderColor: "#065f46", background: "#021c14" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#6ee7b7" }}>📊 Overall Blueprint Quality</div>
                  <QualityScore quality={{ score: avgQuality(), grade: avgQuality() >= 90 ? "A" : avgQuality() >= 75 ? "B" : avgQuality() >= 60 ? "C" : "D", breakdown: null, issues: [] }} compact={true} />
                  <span style={{ fontSize: 11, color: "#64748b" }}>
                    {Object.values(generated).filter(r => r?.quality).length}/{FILE_TYPES.length} files scored
                    {Object.values(generated).some(r => r?.refined) && " · ♻️ Some files were auto-refined"}
                  </span>
                </div>
              </div>
            )}

            {/* ═══ BLUEPRINT TABS (new tabbed view) ═══ */}
            <div ref={resultRef} style={S.card}>
              <BlueprintTabs
                generated={generated}
                config={config}
                ideTarget={ideTarget}
                avgQuality={avgQuality()}
                domain={domain}
                currentIde={currentIde}
                FILE_TYPES={FILE_TYPES}
              >
                <InfoBox type="info">Each file serves a specific purpose. Generate all, or click individual tabs. Quality scores show how production-ready each file is.</InfoBox>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 12 }}>
                  {FILE_TYPES.map(ft => {
                    const result = generated[ft.id];
                    const hasScore = result?.quality?.score;
                    return (
                      <button key={ft.id} style={{
                        padding: "8px 14px", borderRadius: "8px 8px 0 0", border: "1px solid #1e293b",
                        borderBottom: activeTab === ft.id ? "2px solid #fb923c" : "1px solid #1e293b",
                        background: activeTab === ft.id ? "#111827" : "#0a0f1a",
                        color: activeTab === ft.id ? "#fb923c" : "#64748b",
                        cursor: "pointer", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
                      }} onClick={() => setActiveTab(ft.id)}>
                        {result?.output ? "✓ " : generating?.startsWith(ft.id) ? "⏳ " : ""}{ft.label}
                        {hasScore && <QualityScore quality={result.quality} compact={true} />}
                      </button>
                    );
                  })}
                </div>
                {FILE_TYPES.map(ft => activeTab === ft.id && (
                  <div key={ft.id}>
                    <div style={{ padding: "12px 16px", background: "#0c1929", border: "1px solid #1e3a5f", borderRadius: 0, fontSize: 12, color: "#7dd3fc", lineHeight: 1.6 }}>
                      <strong>{ft.layer} — {ft.label}</strong>: {ft.desc} <span style={{ color: "#475569" }}>(~{ft.lines} lines)</span>
                      {generated[ft.id]?.refined && <span style={{ ...S.tag, marginLeft: 8 }}>♻️ Auto-refined</span>}
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "8px 12px", background: "#111827", borderBottom: "1px solid #1e293b" }}>
                      {generated[ft.id]?.output && <CopyButton text={generated[ft.id].output} />}
                      <button onClick={() => handleGenerateFile(ft.id)} disabled={!!generating || !apiKey} style={S.btn(false, !!generating || !apiKey)}>
                        {generating?.startsWith(ft.id) ? "⏳ ..." : generated[ft.id]?.output ? "↻ Regen" : "▶ Generate"}
                      </button>
                    </div>
                    {/* Update Mode: only visible when file already generated */}
                    {generated[ft.id]?.output && (
                      <div style={{ display: "flex", gap: 8, padding: "6px 12px", background: "#0f172a", borderBottom: "1px solid #1e293b", alignItems: "center" }}>
                        <input
                          type="text"
                          placeholder="Describe what changed (e.g., 'added Redis caching', 'switched to GraphQL')..."
                          value={updateInput[ft.id] || ""}
                          onChange={e => setUpdateInput(p => ({ ...p, [ft.id]: e.target.value }))}
                          onKeyDown={e => e.key === "Enter" && handleUpdateFile(ft.id)}
                          disabled={!!generating}
                          style={{ ...S.input, flex: 1, fontSize: 12, padding: "6px 10px" }}
                        />
                        <button onClick={() => handleUpdateFile(ft.id)} disabled={!!generating || !apiKey || !updateInput[ft.id]?.trim()}
                          style={{ ...S.btn(false, !!generating || !apiKey || !updateInput[ft.id]?.trim()), fontSize: 12, padding: "6px 12px", whiteSpace: "nowrap" }}>
                          🔄 Update
                        </button>
                      </div>
                    )}

                    {/* Quality Score for this file */}
                    {generated[ft.id]?.quality && (
                      <div style={{ padding: "12px 16px", background: "#0a0f1a", borderBottom: "1px solid #1e293b" }}>
                        <QualityScore quality={generated[ft.id].quality} />
                      </div>
                    )}

                    <div style={{ background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: "0 0 8px 8px", padding: 16, fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap", overflowX: "auto", maxHeight: 500, overflowY: "auto", color: "#cbd5e1", fontFamily: "JetBrains Mono, monospace" }}>
                      {generating?.startsWith(ft.id) ? (
                        <div style={{ textAlign: "center", padding: 40 }}>
                          <div style={{ fontSize: 28, marginBottom: 8, animation: "pulse 1.5s infinite" }}>⚡</div>
                          <div style={{ color: "#fb923c", fontWeight: 600 }}>Compiling {ft.label}...</div>
                          <div style={{ color: "#475569", fontSize: 11, marginTop: 6 }}>
                            {generating.includes("validating") ? "🔍 Validating output quality..." :
                              generating.includes("refining") ? "♻️ Auto-refining for better quality..." :
                                "📡 Generating with Claude Sonnet 4..."}
                          </div>
                        </div>
                      ) : generated[ft.id]?.output ? generated[ft.id].output : (
                        <div style={{ textAlign: "center", padding: 40, color: "#334155" }}>Click "Generate" or use "Generate All" above</div>
                      )}
                    </div>
                  </div>
                ))}
              </BlueprintTabs>
            </div>

            {/* ═══ FEEDBACK BAR (post-generation) ═══ */}
            {Object.values(generated).some(r => r?.output) && (
              <FeedbackBar
                blueprintId={config.projectName || "untitled"}
                config={config}
                userId={user?.id}
              />
            )}

            {error && <div style={{ ...S.card, borderColor: "#991b1b", background: "#1c0a0a" }}><span style={{ color: "#fca5a5", fontSize: 13 }}>⚠️ {error}</span></div>}

            {/* Global Files (Layer 1) */}
            {Object.keys(generated).length > 0 && (
              <div style={{ ...S.card, borderColor: "#065f46", background: "#021c14" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#6ee7b7", marginBottom: 8 }}>📁 Global Files (Layer 1) — Create Once, Use Forever</div>
                <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, marginBottom: 12 }}>
                  These go in <code style={{ color: "#fb923c" }}>~/.gemini/</code> and are identical for ALL projects. Create them once.
                </div>
                <pre style={{ background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 8, padding: 16, fontSize: 11, lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 180, overflow: "auto", color: "#cbd5e1" }}>{`# ~/.gemini/GEMINI.md
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

            {/* Export Actions */}
            {Object.keys(generated).length > 0 && (
              <div style={{ ...S.card, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>📦 Export Blueprint</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={handleSave} disabled={saveStatus === "saving"} style={{ ...S.btn(false), ...(saveStatus === "saved" ? { borderColor: "#22c55e", color: "#22c55e" } : saveStatus === "error" ? { borderColor: "#ef4444", color: "#ef4444" } : saveStatus === "saving" ? { opacity: 0.7 } : {}) }}>{saveStatus === "saving" ? "⏳ Saving..." : saveStatus === "saved" ? "✅ Saved!" : saveStatus === "error" ? "❌ Error" : "💾 Save to Library"}</button>
                  <button onClick={() => {
                    if (!tierLimits.hasExportZip) {
                      setShowUpgradeModal({ reason: "zip_locked", data: {} });
                      return;
                    }
                    exportAsZip({ config, ideTarget, generated });
                  }} style={S.btn(false)}>
                    📥 Export ZIP {!tierLimits.hasExportZip && <span style={{ fontSize: 9, background: "linear-gradient(135deg, #f59e0b, #fb923c)", color: "#0a0f1a", padding: "1px 5px", borderRadius: 4, fontWeight: 800, marginLeft: 4 }}>PRO</span>}
                  </button>
                  <button onClick={() => {
                    const allText = FILE_TYPES.map(ft => generated[ft.id]?.output ? `\n${"=".repeat(60)}\n# ${ft.label} (${ft.layer})\n${"=".repeat(60)}\n\n${generated[ft.id].output}` : "").join("\n");
                    navigator.clipboard.writeText(allText);
                  }} style={S.btn(true)}>📋 Copy All</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══ FOOTER ═══ */}
        <div style={{ textAlign: "center", padding: "24px 0", borderTop: "1px solid #1e293b", marginTop: 24, fontSize: 11, color: "#334155" }}>
          <p>
            Blueprint Compiler v2.0 — Multi-IDE · Agentic Generation · Quality Scoring
          </p>
          <div style={{ marginTop: 10, display: "flex", justifyContent: "center", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <a href="/" style={{ color: "#64748b", textDecoration: "none", fontSize: 11 }}>🏠 Home</a>
            <a href="/#features" style={{ color: "#64748b", textDecoration: "none", fontSize: 11 }}>✨ Features</a>
            <a href="/#pricing" style={{ color: "#64748b", textDecoration: "none", fontSize: 11 }}>💰 Pricing</a>
            <a href="/docs.html" style={{ color: "#64748b", textDecoration: "none", fontSize: 11 }}>📖 Docs</a>
            <a href="https://github.com/skywalker76/blueprint-compiler" target="_blank" rel="noreferrer" style={{ color: "#64748b", textDecoration: "none", fontSize: 11 }}>🐙 GitHub</a>
          </div>
          <div style={{ marginTop: 8, display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
            <span>Powered by Context Engineering</span>
            <span>·</span>
            <button onClick={() => {
              const newVal = !telemetry;
              setTelemetry(newVal);
              setTelemetryPreference(newVal);
            }} style={{ background: "none", border: "none", color: telemetry ? "#64748b" : "#475569", cursor: "pointer", fontSize: 11, textDecoration: "underline" }}>
              Telemetry: {telemetry ? "On" : "Off"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
