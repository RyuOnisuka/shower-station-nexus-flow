import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
  requiredRole?: 'super_admin' | 'admin' | 'staff';
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ 
  children, 
  requiredRole = 'staff' 
}) => {
  const { isAuthenticated, adminUser, isLoading, hasPermission } = useAdminAuth();

  // แสดง loading ขณะตรวจสอบ authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF6EF] to-[#BFA14A] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#BFA14A]" />
          <p className="text-gray-600">กำลังตรวจสอบสิทธิ์การเข้าถึง...</p>
        </div>
      </div>
    );
  }

  // ถ้าไม่ได้ login ให้ redirect ไปหน้า admin login
  if (!isAuthenticated || !adminUser) {
    return <Navigate to="/admin-login" replace />;
  }

  // ตรวจสอบสิทธิ์ (role)
  if (!hasPermission(requiredRole)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF6EF] to-[#BFA14A] flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-gray-600 mb-4">
            คุณไม่มีสิทธิ์เข้าถึงหน้านี้
          </p>
          <p className="text-sm text-gray-500">
            ต้องการสิทธิ์: {requiredRole === 'super_admin' ? 'Super Admin' : 
                          requiredRole === 'admin' ? 'Admin' : 'Staff'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            สิทธิ์ปัจจุบัน: {adminUser.role === 'super_admin' ? 'Super Admin' : 
                          adminUser.role === 'admin' ? 'Admin' : 'Staff'}
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-[#BFA14A] text-white rounded hover:bg-[#A89040]"
          >
            กลับไป
          </button>
        </div>
      </div>
    );
  }

  // ถ้าผ่านการตรวจสอบทั้งหมด ให้แสดง children
  return <>{children}</>;
};

export default ProtectedAdminRoute; 