import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthFormField from '../components/AuthFormField.jsx';
import AuthPageShell from '../components/AuthPageShell.jsx';
import AuthStatusMessage from '../components/AuthStatusMessage.jsx';
import GoogleAuthButton from '../components/GoogleAuthButton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getReturnPath, withReturnPath } from '../utils/authNavigation.js';

function SignupPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    configured,
    loading,
    signInWithGoogle,
    signUpWithPassword,
    user,
  } = useAuth();
  const returnPath = getReturnPath(location.search);
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [busyAction, setBusyAction] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  if (!loading && user) return <Navigate to={returnPath} replace />;

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (form.password.length < 8) {
      setError('Use at least 8 characters for your password.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setBusyAction('email');
    try {
      const data = await signUpWithPassword({
        email: form.email.trim(),
        password: form.password,
        emailRedirectTo: `${window.location.origin}${withReturnPath('/login', returnPath)}`,
      });
      if (data.session) navigate(returnPath, { replace: true });
      else setMessage('Check your inbox to confirm your email, then return to MediLens to sign in.');
    } catch (authError) {
      setError(authError.message || 'Unable to create your account. Please try again.');
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
      eyebrow="Private MediLens Access"
      title="Create your account"
      description="Keep analysis, results, vault access, and reminders behind your secure sign-in."
      footer={(
        <p>
          Already have an account?{' '}
          <Link className="font-semibold text-white transition hover:text-white/72" to={withReturnPath('/login', returnPath)}>Sign in</Link>
        </p>
      )}
    >
      <div className="space-y-4 lg:space-y-2.5">
        {!configured ? <AuthStatusMessage tone="error">Add your public Supabase URL and anon key to <code>.env.local</code> to enable account creation.</AuthStatusMessage> : null}
        {message ? <AuthStatusMessage>{message}</AuthStatusMessage> : null}
        {error ? <AuthStatusMessage tone="error">{error}</AuthStatusMessage> : null}

        <GoogleAuthButton disabled={!configured || Boolean(busyAction)} onClick={continueWithGoogle} />

        <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/28" aria-hidden="true">
          <span className="h-px flex-1 bg-white/10" />
          or use email
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form className="space-y-4 lg:space-y-2.5" onSubmit={submit}>
          <AuthFormField autoComplete="email" label="Email address" name="email" onChange={updateField} placeholder="you@example.com" type="email" value={form.email} />
          <AuthFormField autoComplete="new-password" label="Password" name="password" onChange={updateField} placeholder="At least 8 characters" type="password" value={form.password} />
          <AuthFormField autoComplete="new-password" label="Confirm password" name="confirmPassword" onChange={updateField} placeholder="Repeat your password" type="password" value={form.confirmPassword} />
          <button
            className="glass-pill-solid flex h-12 w-full items-center justify-center text-sm font-semibold transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-45 lg:h-9 2xl:h-10"
            type="submit"
            disabled={!configured || Boolean(busyAction)}
          >
            {busyAction === 'email' ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>
    </AuthPageShell>
  );
}

export default SignupPage;
