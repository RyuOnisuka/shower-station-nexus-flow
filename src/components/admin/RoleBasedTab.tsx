import React from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface RoleBasedTabProps {
  children: React.ReactNode;
  requiredRole: 'super_admin' | 'admin' | 'staff';
  fallback?: React.ReactNode;
}

const RoleBasedTab: React.FC<RoleBasedTabProps> = ({ 
  children, 
  requiredRole, 
  fallback 
}) => {
  const { hasPermission } = useAdminAuth();

  if (!hasPermission(requiredRole)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

export default RoleBasedTab; 