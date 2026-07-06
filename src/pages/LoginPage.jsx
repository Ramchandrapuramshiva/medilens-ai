import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthFormField from '../components/AuthFormField.jsx';
import AuthPageShell from '../components/AuthPageShell.jsx';
import AuthStatusMessage from '../components/AuthStatusMessage.jsx';
import GoogleAuthButton from '../components/GoogleAuthButton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getReturnPath, withReturnPath } from '../utils/authNavigation.js';

function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    configured,
    loading,
    sessionError,
    signInWithGoogle,
    signInWithPassword,
    user,
  } = useAuth();
  const returnPath = getReturnPath(location.search);
  const query = new URLSearchParams(location.search);
  const passwordUpdated = query.get('message') === 'password-updated';
  const [form, setForm] = useState({ email: '', password: '' });
  const [busyAction, setBusyAction] = useState('');
  const [error, setError] = useState('');

  if (!loading && user) return <Navigate to={returnPath} replace />;

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusyAction('email');
    try {
      await signInWithPassword({ email: form.email.trim(), password: form.password });
      navigate(returnPath, { replace: true });
    } catch (authError) {
      setError(authError.message || 'Unable to sign in. Please verify your details and try again.');
    } finally {
      setBusyAction('');
    }
  };

  const continueWithGoogle = async () => {
    setError('');
    setBusyAction('google');
    try {
      await signInWithGoogle({
        redirectTo: `${window.location.origin}${withReturnPath('/login', returnPath)}`,
      });
    } catch (authError) {
      setError(authError.message || 'Google sign-in could not be started.');
      setBusyAction('');
    }
  };

  return (
    <AuthPageShell
      eyebrow="Secure Workspace"
      title="Welcome back"
      description="Sign in to analyze medical documents and return to your private MediLens workspace."
      footer={(
        <p>
          New to MediLens?{' '}
          <Link className="font-semibold text-white transition hover:text-white/72" to={withReturnPath('/signup', returnPath)}>Create an account</Link>
        </p>
      )}
    >
      <div className="space-y-4 lg:space-y-2.5">
        {!configured ? <AuthStatusMessage tone="error">Authentication is ready in the app, but the Supabase URL and anon key still need to be added to <code>.env.local</code>.</AuthStatusMessage> : null}
        {sessionError ? <AuthStatusMessage tone="error">{sessionError}</AuthStatusMessage> : null}
        {passwordUpdated ? <AuthStatusMessage>Your password was updated. Sign in with your new password.</AuthStatusMessage> : null}
        {error ? <AuthStatusMessage tone="error">{error}</AuthStatusMessage> : null}

        <GoogleAuthButton disabled={!configured || Boolean(busyAction)} onClick={continueWithGoogle} />

        <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/28" aria-hidden="true">
          <span className="h-px flex-1 bg-white/10" />
          or use email
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form className="space-y-4 lg:space-y-2.5" onSubmit={submit}>
          <AuthFormField autoComplete="email" label="Email address" name="email" onChange={updateField} placeholder="you@example.com" type="email" value={form.email} />
          <AuthFormField autoComplete="current-password" label="Password" name="password" onChange={updateField} placeholder="Enter your password" type="password" value={form.password} />
          <div className="flex justify-end">
            <Link className="text-xs font-medium text-white/54 transition hover:text-white" to={withReturnPath('/forgot-password', returnPath)}>Forgot password?</Link>
          </div>
          <button
            className="glass-pill-solid flex h-12 w-full items-center justify-center text-sm font-semibold transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-45 lg:h-9 2xl:h-10"
            type="submit"
            disabled={!configured || Boolean(busyAction)}
          >
            {busyAction === 'email' ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </AuthPageShell>
  );
}

export default LoginPage;
