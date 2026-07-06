import BrandLogo from './BrandLogo.jsx';

function IntroScreen({ exiting = false }) {
  return (
    <div
      className={`intro-screen${exiting ? ' is-exiting' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="MediLens AI is preparing your workspace"
    >
      <div className="intro-ambient" aria-hidden="true" />
      <div className="intro-content">
        <div className="intro-logo-shell" aria-hidden="true">
          <span className="intro-logo-glow" />
          <span className="intro-logo-mark">
            <BrandLogo className="intro-logo-icon" />
          </span>
        </div>

        <div className="intro-copy">
          <h1>MediLens AI</h1>
          <p>Understand prescriptions, medicines, and reports with calm AI-assisted clarity.</p>
        </div>

        <div className="intro-progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}

export default IntroScreen;
