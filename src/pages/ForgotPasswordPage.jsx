import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthFormField from '../components/AuthFormField.jsx';
import AuthPageShell from '../components/AuthPageShell.jsx';
import AuthStatusMessage from '../components/AuthStatusMessage.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getReturnPath, withReturnPath } from '../utils/authNavigation.js';

function ForgotPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    configured,
    isPasswordRecovery,
    loading,
    sendPasswordReset,
    signOut,
    updatePassword,
    user,
  } = useAuth();
  const query = new URLSearchParams(location.search);
  const returnPath = getReturnPath(location.search);
  const recoveryRequested = query.get('mode') === 'update';
  const canUpdatePassword = Boolean(user && (isPasswordRecovery || recoveryRequested));
  const [email, setEmail] = useState('');
  const [passwords, setPasswords] = useState({ password: '', confirmPassword: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const requestReset = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    const redirectUrl = new URL('/forgot-password', window.location.origin);
    redirectUrl.searchParams.set('mode', 'update');
    redirectUrl.searchParams.set('redirect', returnPath);
    try {
      await sendPasswordReset({ email: email.trim(), redirectTo: redirectUrl.toString() });
      setMessage('If an account matches that email, a secure password reset link is on its way.');
    } catch (authError) {
      setError(authError.message || 'Unable to send a password reset email.');
    } finally {
      setBusy(false);
    }
  };

  const updateField = (event) => {
    setPasswords((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setError('');
    if (passwords.password.length < 8) {
      setError('Use at least 8 characters for your new password.');
      return;
    }
    if (passwords.password !== passwords.confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      await updatePassword(passwords.password);
      await signOut();
      navigate(`${withReturnPath('/login', returnPath)}&message=password-updated`, { replace: true });
    } catch (authError) {
      setError(authError.message || 'Unable to update your password. Request a new reset link and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthPageShell
      eyebrow="Account Recovery"
      title={canUpdatePassword ? 'Choose a new password' : 'Reset your password'}
      description={canUpdatePassword
        ? 'Create a new password for your MediLens account.'
        : 'Enter your account email and Supabase will send a secure recovery link.'}
      footer={(
        <Link className="font-semibold text-white transition hover:text-white/72" to={withReturnPath('/login', returnPath)}>Return to sign in</Link>
      )}
    >
      <div className="space-y-4 lg:space-y-2.5">
        {!configured ? <AuthStatusMessage tone="error">Add your public Supabase URL and anon key to <code>.env.local</code> to enable password recovery.</AuthStatusMessage> : null}
        {!loading && recoveryRequested && !canUpdatePassword ? <AuthStatusMessage tone="error">This recovery session is missing or expired. Request a fresh reset link below.</AuthStatusMessage> : null}
        {message ? <AuthStatusMessage>{message}</AuthStatusMessage> : null}
        {error ? <AuthStatusMessage tone="error">{error}</AuthStatusMessage> : null}

        {canUpdatePassword ? (
          <form className="space-y-4 lg:space-y-2.5" onSubmit={savePassword}>
            <AuthFormField autoComplete="new-password" label="New password" name="password" onChange={updateField} placeholder="At least 8 characters" type="password" value={passwords.password} />
            <AuthFormField autoComplete="new-password" label="Confirm new password" name="confirmPassword" onChange={updateField} placeholder="Repeat your new password" type="password" value={passwords.confirmPassword} />
            <button className="glass-pill-solid flex h-12 w-full items-center justify-center text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45 lg:h-9 2xl:h-10" type="submit" disabled={!configured || busy}>
              {busy ? 'Updating password…' : 'Update password'}
            </button>
          </form>
        ) : (
          <form className="space-y-4 lg:space-y-2.5" onSubmit={requestReset}>
            <AuthFormField autoComplete="email" label="Email address" name="email" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" type="email" value={email} />
            <button className="glass-pill-solid flex h-12 w-full items-center justify-center text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45 lg:h-9 2xl:h-10" type="submit" disabled={!configured || busy}>
              {busy ? 'Sending reset link…' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </AuthPageShell>
  );
}

export default ForgotPasswordPage;
