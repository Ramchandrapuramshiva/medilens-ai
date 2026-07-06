import { AnimatePresence, motion } from 'framer-motion';
import { LogIn, LogOut, Menu, Upload, X } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import BrandLogo from './BrandLogo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { withReturnPath } from '../utils/authNavigation.js';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Vault', to: '/vault' },
  { label: 'Reminders', to: '/reminders' },
  { label: 'Safety', to: '/safety' },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = ['/login', '/signup', '/forgot-password'].includes(location.pathname);
  const { loading, signOut, user } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email || 'MediLens user';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initial = displayName.trim().charAt(0).toUpperCase() || 'M';

  const handleSignOut = async () => {
    setSignOutError('');
    setIsSigningOut(true);
    try {
      await signOut();
      setIsOpen(false);
      navigate('/login', { replace: true });
    } catch (error) {
      setSignOutError(error.message || 'Unable to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);

  if (isAuthPage) {
    return (
      <motion.header
        className="fixed inset-x-0 top-4 z-40 flex justify-center px-4 sm:top-5 sm:px-6 lg:px-10 xl:px-14"
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      >
        <nav className="liquid-glass flex w-full max-w-[90rem] items-center rounded-full px-3 py-2.5 shadow-2xl shadow-black/30 sm:px-4" aria-label="Authentication">
          <NavLink to="/" className="group flex shrink-0 items-center gap-2.5 pl-1">
            <BrandLogo className="size-8 transition-transform duration-300 group-hover:rotate-6" />
            <span className="text-sm font-medium tracking-[-0.03em] text-white sm:text-[15px]">MediLens AI</span>
          </NavLink>
        </nav>
      </motion.header>
    );
  }

  return (
    <motion.header
      className="fixed inset-x-0 top-4 z-40 flex justify-center px-4 sm:top-6"
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
    >
      <nav className="liquid-glass relative flex w-full max-w-5xl items-center justify-between rounded-full px-3 py-2.5 shadow-2xl shadow-black/30 sm:px-4">
        <NavLink to="/" className="group flex shrink-0 items-center gap-2.5 pl-1">
          <BrandLogo className="size-8 transition-transform duration-300 group-hover:rotate-6" />
          <span className="text-sm font-medium tracking-[-0.03em] text-white sm:text-[15px]">MediLens AI</span>
        </NavLink>

        {user && (
          <div className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-sm font-normal tracking-[-0.02em] transition ${isActive ? 'text-white' : 'text-white/58 hover:text-white'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}

        <div className="hidden items-center gap-2 md:flex">
          {!loading && user ? (
            <div className="flex items-center gap-2">
              <span className="grid size-9 overflow-hidden rounded-full border border-white/18 bg-white/[0.08] text-xs font-semibold text-white" title={displayName}>
                {avatarUrl ? <img className="h-full w-full object-cover" src={avatarUrl} alt="" referrerPolicy="no-referrer" /> : <span className="grid h-full w-full place-items-center">{initial}</span>}
              </span>
              <button className="nav-button-outline flex h-10 items-center gap-2 px-3 text-xs font-semibold transition hover:text-white disabled:opacity-45" type="button" onClick={handleSignOut} disabled={isSigningOut}>
                <LogOut className="size-3.5" />
                {isSigningOut ? 'Leaving…' : 'Logout'}
              </button>
            </div>
          ) : !loading && !isAuthPage ? (
            <button className="nav-button-outline flex h-10 items-center gap-2 px-3 text-xs font-semibold transition hover:text-white" type="button" onClick={() => navigate(withReturnPath('/login', '/'))}>
              <LogIn className="size-3.5" />
              Login
            </button>
          ) : null}
          {user && (
            <button
              className="nav-button-solid flex items-center gap-2 px-5 py-2.5 text-sm font-medium tracking-[-0.02em] transition hover:scale-[1.02]"
              type="button"
              onClick={() => navigate('/analyze')}
            >
              <Upload className="size-4" />
              Analyze
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {!loading && user ? (
            <span className="grid size-10 overflow-hidden rounded-full border border-white/18 bg-white/[0.08] text-xs font-semibold text-white" title={displayName}>
              {avatarUrl ? <img className="h-full w-full object-cover" src={avatarUrl} alt="" referrerPolicy="no-referrer" /> : <span className="grid h-full w-full place-items-center">{initial}</span>}
            </span>
          ) : !loading && !isAuthPage ? (
            <button className="glass-pill flex h-10 items-center gap-2 px-3 text-xs font-semibold text-white" type="button" onClick={() => navigate(withReturnPath('/login', '/'))}>
              <LogIn className="size-3.5" />
              Login
            </button>
          ) : null}
          {user && (
            <button
              className="glass-pill grid size-10 place-items-center text-white"
              type="button"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
              onClick={() => setIsOpen((value) => !value)}
            >
              {isOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          )}
        </div>

        <AnimatePresence>
          {isOpen ? (
            <motion.div
              id="mobile-navigation"
              className="mobile-nav-dropdown p-3 md:hidden"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <div className="flex flex-col gap-1">
                {user && [...navItems, { label: 'Analyze', to: '/analyze' }].map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `rounded-full px-4 py-3 text-sm transition ${isActive ? 'bg-white/[0.09] text-white' : 'text-white/72 hover:bg-white/[0.07] hover:text-white'}`
                    }
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                ))}
                {user && <div className="my-2 h-px bg-white/10" />}
                {!loading && user ? (
                  <>
                    <div className="rounded-full px-4 py-2 text-xs text-white/48" title={displayName}>{user.email}</div>
                    <button className="flex items-center gap-2 rounded-full px-4 py-3 text-left text-sm text-white/72 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-45" type="button" onClick={handleSignOut} disabled={isSigningOut}>
                      <LogOut className="size-4" />
                      {isSigningOut ? 'Signing out…' : 'Logout'}
                    </button>
                  </>
                ) : !loading && !isAuthPage ? (
                  <>
                    <NavLink className="flex items-center gap-2 rounded-full px-4 py-3 text-sm text-white/72 transition hover:bg-white/[0.07] hover:text-white" to={withReturnPath('/login', '/')} onClick={() => setIsOpen(false)}><LogIn className="size-4" />Login</NavLink>
                    <NavLink className="rounded-full px-4 py-3 text-sm text-white/72 transition hover:bg-white/[0.07] hover:text-white" to={withReturnPath('/signup', '/')} onClick={() => setIsOpen(false)}>Create account</NavLink>
                  </>
                ) : null}
                {signOutError ? <p className="px-4 py-2 text-xs leading-5 text-white/58" role="alert">{signOutError}</p> : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </nav>
    </motion.header>
  );
}

export default Navbar;
