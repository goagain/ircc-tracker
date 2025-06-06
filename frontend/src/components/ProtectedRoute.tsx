import React from 'react';
import { Navigate } from 'react-router-dom';
import { User, UserRole } from '../types/user';

interface ProtectedRouteProps {
  user: User | null;
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, children, requireAdmin = false }) => {
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && user.role !== UserRole.ADMIN) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 