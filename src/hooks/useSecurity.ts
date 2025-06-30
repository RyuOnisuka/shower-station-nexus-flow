import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createAuditLog } from './useAuditLogs';

interface SecuritySettings {
  max_login_attempts: number;
  lockout_duration: number; // minutes
  session_timeout: number; // minutes
  require_2fa: boolean;
  password_policy: {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_special: boolean;
  };
  ip_whitelist: string[];
  activity_monitoring: boolean;
}

interface LoginAttempt {
  id: string;
  username: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
  created_at: string;
}

interface SecurityAlert {
  id: string;
  type: 'failed_login' | 'suspicious_activity' | 'unauthorized_access' | 'data_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  created_at: string;
  resolved: boolean;
}

// Hook สำหรับจัดการ Security Settings
export const useSecuritySettings = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['security_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('category', 'security')
        .single();

      if (error) throw error;
      return (data?.settings as unknown as SecuritySettings) || getDefaultSecuritySettings();
    }
  });

  const updateSecuritySettings = useMutation({
    mutationFn: async (newSettings: Partial<SecuritySettings>) => {
      const { data, error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'security_settings',
          setting_value: 'default',
          description: 'Security configuration settings',
          category: 'security',
          settings: { ...settings, ...newSettings },
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security_settings'] });
    }
  });

  return {
    settings,
    isLoading,
    updateSecuritySettings
  };
};

// Hook สำหรับจัดการ Login Attempts
export const useLoginAttempts = (filters?: {
  username?: string;
  ip_address?: string;
  success?: boolean;
  date_from?: string;
  date_to?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['login_attempts', filters],
    queryFn: async () => {
      let query = supabase
        .from('login_attempts')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.username) {
        query = query.eq('username', filters.username);
      }
      if (filters?.ip_address) {
        query = query.eq('ip_address', filters.ip_address);
      }
      if (filters?.success !== undefined) {
        query = query.eq('success', filters.success);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });
};

// Hook สำหรับจัดการ Security Alerts
export const useSecurityAlerts = () => {
  const queryClient = useQueryClient();

  const { data: alerts, isLoading, refetch } = useQuery({
    queryKey: ['security_alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    }
  });

  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase
        .from('security_alerts')
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security_alerts'] });
    }
  });

  return {
    alerts,
    isLoading,
    resolveAlert,
    refetch
  };
};

// Hook สำหรับตรวจสอบ IP Address
export const useIPCheck = () => {
  const [ipInfo, setIpInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkIP = async (ip: string) => {
    setIsLoading(true);
    try {
      // ใช้ free IP geolocation API
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await response.json();
      setIpInfo(data);
      return data;
    } catch (error) {
      console.error('IP check error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    ipInfo,
    isLoading,
    checkIP
  };
};

// Utility functions
export const getDefaultSecuritySettings = (): SecuritySettings => ({
  max_login_attempts: 5,
  lockout_duration: 30,
  session_timeout: 480, // 8 hours
  require_2fa: false,
  password_policy: {
    min_length: 8,
    require_uppercase: true,
    require_lowercase: true,
    require_numbers: true,
    require_special: true
  },
  ip_whitelist: [],
  activity_monitoring: true
});

export const validatePassword = (password: string, policy: SecuritySettings['password_policy']): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < policy.min_length) {
    errors.push(`รหัสผ่านต้องมีความยาวอย่างน้อย ${policy.min_length} ตัวอักษร`);
  }

  if (policy.require_uppercase && !/[A-Z]/.test(password)) {
    errors.push('รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว');
  }

  if (policy.require_lowercase && !/[a-z]/.test(password)) {
    errors.push('รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว');
  }

  if (policy.require_numbers && !/\d/.test(password)) {
    errors.push('รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว');
  }

  if (policy.require_special && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const checkLoginAttempts = async (username: string, ip: string): Promise<{ blocked: boolean; remainingAttempts: number }> => {
  try {
    // ดึง security settings
    const { data: settingsData } = await supabase
      .from('system_settings')
      .select('settings')
      .eq('category', 'security')
      .single();

    const securitySettings = (settingsData?.settings as unknown as SecuritySettings) || getDefaultSecuritySettings();
    const maxAttempts = securitySettings.max_login_attempts || 5;
    const lockoutDuration = securitySettings.lockout_duration || 30; // นาที
    
    // คำนวณเวลาที่ lockout เริ่มต้น
    const lockoutTime = new Date(Date.now() - lockoutDuration * 60 * 1000);

    // นับ failed attempts ในช่วง lockout duration
    const { data: failedAttempts, error } = await supabase
      .from('login_attempts')
      .select('*')
      .eq('username', username)
      .eq('success', false)
      .gte('created_at', lockoutTime.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error checking login attempts:', error);
      return { blocked: false, remainingAttempts: maxAttempts };
    }

    const failedCount = failedAttempts?.length || 0;
    const remainingAttempts = Math.max(0, maxAttempts - failedCount);
    const blocked = failedCount >= maxAttempts;

    console.log(`Login attempts for ${username}: failed=${failedCount}, remaining=${remainingAttempts}, blocked=${blocked}`);

    return { blocked, remainingAttempts };
  } catch (error) {
    console.error('Check login attempts error:', error);
    return { blocked: false, remainingAttempts: 5 };
  }
};

export const recordLoginAttempt = async (data: {
  username: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
}) => {
  try {
    console.log(`Recording login attempt: ${data.username}, success: ${data.success}`);
    
    // บันทึก login attempt
    const { error: insertError } = await supabase
      .from('login_attempts')
      .insert({
        username: data.username,
        ip_address: data.ip_address,
        user_agent: data.user_agent,
        success: data.success
      });

    if (insertError) {
      console.error('Error inserting login attempt:', insertError);
      return;
    }

    console.log(`Successfully recorded login attempt for ${data.username}`);

    // ตรวจสอบ suspicious activity สำหรับ failed attempts
    if (!data.success) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      
      const { data: recentAttempts } = await supabase
        .from('login_attempts')
        .select('*')
        .eq('username', data.username)
        .eq('success', false)
        .gte('created_at', tenMinutesAgo.toISOString());

      const failedCount = recentAttempts?.length || 0;
      
      // สร้าง security alert ถ้ามี failed attempts มากกว่า 3 ครั้ง
      if (failedCount >= 3) {
        const severity = failedCount >= 5 ? 'high' : 'medium';
        
        const { error: alertError } = await supabase
          .from('security_alerts')
          .insert({
            type: 'failed_login',
            severity: severity,
            message: `Multiple failed login attempts detected for user: ${data.username}`,
            details: {
              username: data.username,
              ip_address: data.ip_address,
              failed_attempts: failedCount,
              time_window: '10 minutes',
              last_attempt: new Date().toISOString()
            }
          });

        if (alertError) {
          console.error('Error creating security alert:', alertError);
        } else {
          console.log(`Created security alert for ${data.username}: ${failedCount} failed attempts`);
        }
      }
    }
  } catch (error) {
    console.error('Record login attempt error:', error);
  }
};

export const generateSecurePassword = (length: number = 12): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // รับประกันว่ามีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักขระพิเศษ
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
  
  // เติมส่วนที่เหลือ
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // สลับตำแหน่ง
  return password.split('').sort(() => Math.random() - 0.5).join('');
}; 