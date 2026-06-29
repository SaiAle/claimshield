import heroDemo from './assets/hero-demo.mp4';

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

      {/* Hero with full-bleed background video */}
      <header className="hero">
        <video
          className="hero-bg-video"
          src={heroDemo}
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="hero-bg-overlay" />

        <div className="hero-copy glass-panel">
          <h2 className="hero-title">
            Catch fraud. <span className="grad-text">Pay faster.</span>
          </h2>
          <p className="hero-subtitle">
            AI triages every claim, scores fraud risk, and sends only the tricky ones to your adjusters.
          </p>
          <div className="hero-actions">
            <button className="quick-submit-btn hero-cta" onClick={onEnter}>
              Launch Adjuster Portal →
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}

export default LandingPage;
