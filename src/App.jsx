import { lazy, Suspense, useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import BackgroundVideo from './components/BackgroundVideo.jsx';
import IntroScreen from './components/IntroScreen.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LandingPage from './pages/LandingPage.jsx';

const pageLoaders = {
  landing: () => Promise.resolve({ default: LandingPage }),
  analyze: () => import('./pages/AnalyzePage.jsx'),
  results: () => import('./pages/ResultsPage.jsx'),
  vault: () => import('./pages/HealthVaultPage.jsx'),
  reminders: () => import('./pages/ReminderPage.jsx'),
  safety: () => import('./pages/SafetyPage.jsx'),
  login: () => import('./pages/LoginPage.jsx'),
  signup: () => import('./pages/SignupPage.jsx'),
  forgotPassword: () => import('./pages/ForgotPasswordPage.jsx'),
};

const AnalyzePage = lazy(pageLoaders.analyze);
const ResultsPage = lazy(pageLoaders.results);
const HealthVaultPage = lazy(pageLoaders.vault);
const ReminderPage = lazy(pageLoaders.reminders);
const SafetyPage = lazy(pageLoaders.safety);
const LoginPage = lazy(pageLoaders.login);
const SignupPage = lazy(pageLoaders.signup);
const ForgotPasswordPage = lazy(pageLoaders.forgotPassword);

const loaderForPath = (pathname) => {
  if (pathname.startsWith('/analyze')) return pageLoaders.analyze;
  if (pathname.startsWith('/results')) return pageLoaders.results;
  if (pathname.startsWith('/vault')) return pageLoaders.vault;
  if (pathname.startsWith('/reminders')) return pageLoaders.reminders;
  if (pathname.startsWith('/safety')) return pageLoaders.safety;
  if (pathname.startsWith('/login')) return pageLoaders.login;
  if (pathname.startsWith('/signup')) return pageLoaders.signup;
  if (pathname.startsWith('/forgot-password')) return pageLoaders.forgotPassword;
  return pageLoaders.landing;
};

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

function RouteFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-5 pt-24" role="status" aria-live="polite">
      <div className="liquid-glass flex items-center gap-3 rounded-full px-5 py-3 text-sm text-white/72">
        <span className="relative flex size-2.5" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/45" />
          <span className="relative inline-flex size-2.5 rounded-full bg-white" />
        </span>
        Preparing your MediLens workspace
      </div>
    </div>
  );
}

function AppShell() {
  return (
    <MotionConfig reducedMotion="user">
      <main className="app-shell relative isolate min-h-screen overflow-x-hidden bg-black text-white">
        <BackgroundVideo />
        <div className="cinematic-depth fixed inset-0 -z-10" />
        <div className="cinematic-streaks fixed inset-0 -z-10" />
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_6%,rgba(255,255,255,0.42),transparent_19rem),radial-gradient(ellipse_at_50%_46%,rgba(255,255,255,0.16),transparent_35rem)]" />
        <div className="fixed inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.68)_0%,rgba(0,0,0,0.34)_38%,rgba(0,0,0,0.64)_66%,rgba(0,0,0,0.94)_100%)]" />
        <div className="fixed inset-x-0 top-0 -z-10 h-48 bg-gradient-to-b from-black/70 to-transparent" />

        <ScrollToTop />
        <Navbar />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/safety" element={<SafetyPage />} />
              <Route path="/analyze" element={<AnalyzePage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/vault" element={<HealthVaultPage />} />
              <Route path="/reminders" element={<ReminderPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </MotionConfig>
  );
}

function App() {
  const [introPhase, setIntroPhase] = useState('visible');
  const [reducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    let cancelled = false;
    const timers = [];
    const wait = (delay) => new Promise((resolve) => {
      timers.push(window.setTimeout(resolve, delay));
    });
    const routeReady = loaderForPath(window.location.pathname)().catch(() => undefined);

    document.fonts?.load('400 1em "Instrument Serif"').catch(() => undefined);
    document.fonts?.load('400 1em "Inter"').catch(() => undefined);

    const elapsed = performance.now();
    const exitDelay = Math.max(0, (reducedMotion ? 300 : 1500) - elapsed);
    const completeDelay = reducedMotion ? 90 : 520;

    const runIntro = async () => {
      await wait(exitDelay);
      await Promise.race([routeReady, wait(reducedMotion ? 220 : 450)]);
      if (cancelled) return;
      setIntroPhase('exiting');
      await wait(completeDelay);
      if (!cancelled) setIntroPhase('complete');
    };

    runIntro();
    const failSafeTimer = window.setTimeout(() => {
      if (!cancelled) setIntroPhase('complete');
    }, 2700);

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(failSafeTimer);
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (introPhase === 'complete') return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [introPhase]);

  return (
    <>
      {introPhase !== 'visible' ? <AppShell /> : null}
      {introPhase !== 'complete' ? <IntroScreen exiting={introPhase === 'exiting'} /> : null}
    </>
  );
}

export default App;
