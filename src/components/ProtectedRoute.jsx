import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getLocationPath, withReturnPath } from '../utils/authNavigation.js';

function ProtectedRoute() {
  const location = useLocation();
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-5 pt-24" role="status" aria-live="polite">
        <div className="liquid-glass flex items-center gap-3 rounded-full px-5 py-3 text-sm text-white/72">
          <span className="relative flex size-2.5" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/45" />
            <span className="relative inline-flex size-2.5 rounded-full bg-white" />
          </span>
          Verifying your secure session
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={withReturnPath('/login', getLocationPath(location))} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
