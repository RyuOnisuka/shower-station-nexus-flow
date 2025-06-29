import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AdminUser = Database['public']['Tables']['admin_users']['Row'];

interface AdminLoginData {
  username: string;
  password: string;
}

interface AdminSession {
  adminUser: AdminUser;
  sessionToken: string;
  expiresAt: string;
}

// Hook สำหรับตรวจสอบสถานะการ Login ของ Admin
export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAdminSession();
  }, []);

  const checkAdminSession = async () => {
    try {
      const sessionToken = localStorage.getItem('adminSessionToken');
      
      if (!sessionToken) {
        setIsAuthenticated(false);
        setAdminUser(null);
        setIsLoading(false);
        return;
      }

      // ตรวจสอบ session token
      const { data: session, error } = await supabase
        .from('admin_sessions')
        .select(`
          *,
          admin_user:admin_users(*)
        `)
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !session || !session.admin_user) {
        // Session หมดอายุหรือไม่ถูกต้อง
        localStorage.removeItem('adminSessionToken');
        setIsAuthenticated(false);
        setAdminUser(null);
        setIsLoading(false);
        return;
      }

      // Session ยังใช้งานได้
      setIsAuthenticated(true);
      setAdminUser(session.admin_user);
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking admin session:', error);
      setIsAuthenticated(false);
      setAdminUser(null);
      setIsLoading(false);
    }
  };

  const login = async (loginData: AdminLoginData): Promise<{ success: boolean; message: string; adminUser?: AdminUser }> => {
    try {
      // ตรวจสอบ username และ password
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', loginData.username)
        .eq('is_active', true)
        .single();

      if (error || !adminUser) {
        return { success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
      }

      // ตรวจสอบ password (ในที่นี้ใช้ dummy check)
      // ในระบบจริงควรใช้ bcrypt หรือ argon2
      // ใช้ username เป็น password สำหรับ demo
      if (loginData.password !== loginData.username) {
        return { success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
      }

      // สร้าง session token
      const sessionToken = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 ชั่วโมง

      // บันทึก session
      const { error: sessionError } = await supabase
        .from('admin_sessions')
        .insert({
          admin_user_id: adminUser.id,
          session_token: sessionToken,
          expires_at: expiresAt
        });

      if (sessionError) {
        return { success: false, message: 'เกิดข้อผิดพลาดในการสร้าง session' };
      }

      // อัปเดต last_login
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', adminUser.id);

      // บันทึก session token ใน localStorage
      localStorage.setItem('adminSessionToken', sessionToken);

      setIsAuthenticated(true);
      setAdminUser(adminUser);

      return { success: true, message: 'เข้าสู่ระบบสำเร็จ', adminUser };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' };
    }
  };

  const logout = async () => {
    try {
      const sessionToken = localStorage.getItem('adminSessionToken');
      
      if (sessionToken) {
        // ลบ session จากฐานข้อมูล
        await supabase
          .from('admin_sessions')
          .delete()
          .eq('session_token', sessionToken);
      }

      // ลบ session token จาก localStorage
      localStorage.removeItem('adminSessionToken');
      
      setIsAuthenticated(false);
      setAdminUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const hasPermission = (requiredRole: 'super_admin' | 'admin' | 'staff'): boolean => {
    if (!adminUser) return false;

    const roleHierarchy = {
      'super_admin': 3,
      'admin': 2,
      'staff': 1
    };

    const userRoleLevel = roleHierarchy[adminUser.role];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    return userRoleLevel >= requiredRoleLevel;
  };

  return {
    isAuthenticated,
    adminUser,
    isLoading,
    login,
    logout,
    hasPermission,
    checkAdminSession
  };
};

// Hook สำหรับจัดการ Admin Users (Super Admin เท่านั้น)
export const useAdminUsers = () => {
  const queryClient = useQueryClient();

  const { data: adminUsers, isLoading, error } = useQuery({
    queryKey: ['admin_users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const createAdminUser = useMutation({
    mutationFn: async (userData: {
      username: string;
      email: string;
      password: string;
      role: 'super_admin' | 'admin' | 'staff';
    }) => {
      const { data, error } = await supabase
        .from('admin_users')
        .insert({
          username: userData.username,
          email: userData.email,
          password_hash: `$2a$10$dummy.hash.for.${userData.username}`, // ในระบบจริงควร hash password
          role: userData.role
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
    }
  });

  const updateAdminUser = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AdminUser> }) => {
      const { data, error } = await supabase
        .from('admin_users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
    }
  });

  const deleteAdminUser = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
    }
  });

  return {
    adminUsers,
    isLoading,
    error,
    createAdminUser,
    updateAdminUser,
    deleteAdminUser
  };
}; 