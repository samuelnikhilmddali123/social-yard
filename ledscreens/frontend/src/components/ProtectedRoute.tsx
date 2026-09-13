import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth, needsProfileCompletion } from '../AuthContext';

interface Props {
  children: ReactNode;
  adminOnly?: boolean;
  govOnly?: boolean;
  requireProfile?: boolean;
}

const ProtectedRoute = ({ children, adminOnly, govOnly, requireProfile }: Props) => {
  const location = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const userRole = user?.role || localStorage.getItem('userRole');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const isGovPath = location.pathname.startsWith('/gov');
    return <Navigate to={isGovPath ? '/gov-login' : '/login'} state={{ from: location }} replace />;
  }

  if (adminOnly && userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (govOnly && userRole !== 'government' && userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (requireProfile && needsProfileCompletion(user)) {
    return <Navigate to="/complete-profile" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
