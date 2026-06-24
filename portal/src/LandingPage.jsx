import heroDemo from './assets/hero-demo.mp4';

const PIPELINE = [
  { stage: 'Intake', icon: '📥', desc: 'Webhooks capture claims from email, portal, or API and spawn a Maestro Case.' },
  { stage: 'Triage', icon: '🧭', desc: 'The Triage Agent checks documents and policy coverage limits.' },
  { stage: 'Investigation', icon: '🔍', desc: 'The Fraud Agent audits history and scores risk from 0–100%.' },
  { stage: 'Review', icon: '🧑‍⚖️', desc: 'Flagged cases route to a human adjuster for a final decision.' },
  { stage: 'Settlement', icon: '💸', desc: 'Approved claims trigger an RPA robot to dispatch the payout.' },
];

const FEATURES = [
  {
    icon: '🤖',
    title: 'Autonomous AI Triage',
    desc: 'Coded agents parse unstructured claim text and validate it against travel-insurance policy rules in milliseconds.',
  },
  {
    icon: '🛡️',
    title: 'Pattern-Based Fraud Detection',
    desc: 'Heuristic auditing flags duplicate policies, limit exhaustion, and suspicious keywords with a transparent risk score.',
  },
  {
    icon: '🧑‍⚖️',
    title: 'Human-in-the-Loop',
    desc: 'Medium and high-risk cases land in the adjuster workspace with full reasoning, evidence, and audit logs.',
  },
  {
    icon: '⚙️',
    title: 'UiPath Orchestration',
    desc: 'Maestro Case manages every state transition while RPA robots execute settlement payouts end to end.',
  },
];

function LandingPage({ onEnter }) {
  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="brand-section">
          <div className="logo-icon">CS</div>
          <div className="brand-title">
            <h1>ClaimShield</h1>
            <p>Agentic Case Manager</p>
          </div>
        </div>
        <button className="quick-submit-btn" onClick={onEnter}>
          Launch Portal
        </button>
      </nav>

      {/* Hero */}
      <header className="hero">
        <div className="hero-copy">
          <span className="hero-badge">UiPath AgentHack · Track 1 — Maestro Case</span>
          <h2 className="hero-title">
            Intelligent insurance claims &amp; <span className="grad-text">fraud case manager</span>
          </h2>
          <p className="hero-subtitle">
            ClaimShield triages travel-insurance claims, scores fraud risk, and routes exceptions to
            human adjusters — orchestrated end to end on UiPath Automation Cloud.
          </p>
          <div className="hero-actions">
            <button className="quick-submit-btn hero-cta" onClick={onEnter}>
              Launch Adjuster Portal →
            </button>
            <a className="btn-secondary hero-cta" href="#pipeline">
              See how it works
            </a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-num">0–100%</span>
              <span className="hero-stat-label">Fraud Risk Scoring</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-num">5-stage</span>
              <span className="hero-stat-label">Case Lifecycle</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-num">Auto + Human</span>
              <span className="hero-stat-label">Decisioning</span>
            </div>
          </div>
        </div>

        {/* Product demo video */}
        <div className="hero-visual">
          <div className="hero-video-frame">
            <video
              className="hero-video"
              src={heroDemo}
              autoPlay
              muted
              loop
              playsInline
              controls
            />
          </div>
        </div>
      </header>

      {/* Pipeline */}
      <section id="pipeline" className="landing-section">
        <h3 className="section-title">From claim to settlement in five stages</h3>
        <p className="section-subtitle">A single Maestro Case orchestrates every transition.</p>
        <div className="pipeline-grid">
          {PIPELINE.map((p, i) => (
            <div key={p.stage} className="pipeline-step">
              <div className="pipeline-icon">{p.icon}</div>
              <div className="pipeline-step-num">Stage {i + 1}</div>
              <div className="pipeline-step-title">{p.stage}</div>
              <p className="pipeline-step-desc">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="landing-section">
        <h3 className="section-title">Built for exception-heavy claims</h3>
        <p className="section-subtitle">Hybrid agents do the heavy lifting; humans stay in control.</p>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="cta-band">
        <h3>Ready to triage smarter?</h3>
        <p>Open the adjuster workspace and review live cases scored by the agents.</p>
        <button className="quick-submit-btn hero-cta" onClick={onEnter}>
          Launch Adjuster Portal →
        </button>
      </section>

      <footer className="landing-footer">
        <span>ClaimShield · Agentic Insurance Case Manager</span>
        <span>Powered by UiPath Automation Cloud</span>
      </footer>
    </div>
  );
}

export default LandingPage;
