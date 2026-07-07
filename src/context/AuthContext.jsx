import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient.js';

const AuthContext = createContext(null);

const CONFIGURATION_ERROR =
  'Supabase authentication is not configured. Add the public Supabase URL and anon key to .env.local.';

async function getAuthClient() {
  const client = await getSupabaseClient();
  if (!client) throw new Error(CONFIGURATION_ERROR);
  return client;
}

async function syncUserProfile(client, user) {
  if (!user?.id) return;

  const profile = {
    id: user.id,
    email: user.email ?? '',
    full_name:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'MediLens User',
    avatar_url:
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      '',
  };

  const { error } = await client
    .from('profiles')
    .upsert(profile, { onConflict: 'id' });

  if (error) {
    console.error('Profile sync failed:', error);
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(() => (
    window.location.hash.includes('type=recovery') ||
    new URLSearchParams(window.location.search).get('type') === 'recovery'
  ));

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    let subscription;

    getSupabaseClient()
      .then((client) => {
        if (!active || !client) return;

        ({ data: { subscription } } = client.auth.onAuthStateChange(
          (event, nextSession) => {
            if (!active) return;

            setSession(nextSession);
            setLoading(false);

            if (nextSession?.user) {
              syncUserProfile(client, nextSession.user);
            }

            if (event === 'PASSWORD_RECOVERY') {
              setIsPasswordRecovery(true);
            }

            if (event === 'SIGNED_OUT') {
              setIsPasswordRecovery(false);
            }
          },
        ));

        client.auth
          .getSession()
          .then(({ data, error }) => {
            if (!active) return;

            if (error) {
              setSessionError(error.message);
            }

            setSession(data.session ?? null);
            setLoading(false);

            if (data.session?.user) {
              syncUserProfile(client, data.session.user);
            }
          })
          .catch((error) => {
            if (!active) return;

            setSessionError(error.message || 'Unable to restore your secure session.');
            setLoading(false);
          });
      })
      .catch((error) => {
        if (!active) return;

        setSessionError(error.message || 'Unable to initialize authentication.');
        setLoading(false);
      });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signInWithPassword = useCallback(async ({ email, password }) => {
    const client = await getAuthClient();

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }, []);

  const signUpWithPassword = useCallback(async ({ email, password, emailRedirectTo }) => {
    const client = await getAuthClient();

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });

    if (error) throw error;
    return data;
  }, []);

  const signInWithGoogle = useCallback(async ({ redirectTo }) => {
    const client = await getAuthClient();

    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });

    if (error) throw error;
    return data;
  }, []);

  const sendPasswordReset = useCallback(async ({ email, redirectTo }) => {
    const client = await getAuthClient();

    const { data, error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) throw error;
    return data;
  }, []);

  const updatePassword = useCallback(async (password) => {
    const client = await getAuthClient();

    const { data, error } = await client.auth.updateUser({ password });

    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    const client = await getAuthClient();

    const { error } = await client.auth.signOut();

    if (error) throw error;
  }, []);

  const value = useMemo(() => ({
    configured: isSupabaseConfigured,
    isPasswordRecovery,
    loading,
    session,
    sessionError,
    signInWithGoogle,
    signInWithPassword,
    signOut,
    signUpWithPassword,
    updatePassword,
    sendPasswordReset,
    user: session?.user ?? null,
  }), [
    isPasswordRecovery,
    loading,
    session,
    sessionError,
    signInWithGoogle,
    signInWithPassword,
    signOut,
    signUpWithPassword,
    updatePassword,
    sendPasswordReset,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}