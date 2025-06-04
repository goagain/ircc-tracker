import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, user, requireAdmin = false }) => {
  // 检查用户是否已登录
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 检查是否需要管理员权限
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute; 