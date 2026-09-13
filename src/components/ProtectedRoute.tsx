import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'tenant';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !userProfile) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userProfile.role !== requiredRole) {
    const redirectPath = userProfile.role === 'admin' ? '/admin/dashboard' : '/tenant/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
