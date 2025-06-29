import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

interface CreateAuditLogData {
  action: string;
  table_name?: string;
  record_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
}

// Hook สำหรับสร้าง Audit Log
export const useCreateAuditLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAuditLogData) => {
      const { data: auditLog, error } = await supabase
        .from('audit_logs')
        .insert({
          action: data.action,
          table_name: data.table_name,
          record_id: data.record_id,
          old_values: data.old_values,
          new_values: data.new_values,
          ip_address: data.ip_address,
          user_agent: data.user_agent
        })
        .select()
        .single();

      if (error) throw error;
      return auditLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit_logs'] });
    }
  });
};

// Hook สำหรับดึง Audit Logs
export const useAuditLogs = (filters?: {
  action?: string;
  table_name?: string;
  admin_user_id?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['audit_logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          admin_user:admin_users(username, email, role)
        `)
        .order('created_at', { ascending: false });

      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.table_name) {
        query = query.eq('table_name', filters.table_name);
      }
      if (filters?.admin_user_id) {
        query = query.eq('admin_user_id', filters.admin_user_id);
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

// Hook สำหรับดึง Audit Log Statistics
export const useAuditLogStats = () => {
  return useQuery({
    queryKey: ['audit_log_stats'],
    queryFn: async () => {
      // ดึงสถิติการใช้งานตาม action
      const { data: actionStats, error: actionError } = await supabase
        .from('audit_logs')
        .select('action, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // 30 วัน

      if (actionError) throw actionError;

      // นับจำนวนตาม action
      const actionCounts = actionStats?.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // ดึงสถิติตาม admin user
      const { data: userStats, error: userError } = await supabase
        .from('audit_logs')
        .select(`
          admin_user_id,
          admin_user:admin_users(username, role)
        `)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (userError) throw userError;

      // นับจำนวนตาม admin user
      const userCounts = userStats?.reduce((acc, log) => {
        const username = log.admin_user?.username || 'Unknown';
        acc[username] = (acc[username] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        actionCounts,
        userCounts,
        totalLogs: actionStats?.length || 0
      };
    }
  });
};

// Utility function สำหรับสร้าง audit log
export const createAuditLog = async (data: CreateAuditLogData) => {
  try {
    const { data: auditLog, error } = await supabase
      .from('audit_logs')
      .insert({
        action: data.action,
        table_name: data.table_name,
        record_id: data.record_id,
        old_values: data.old_values,
        new_values: data.new_values,
        ip_address: data.ip_address,
        user_agent: data.user_agent
      })
      .select()
      .single();

    if (error) throw error;
    return auditLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // ไม่ throw error เพื่อไม่ให้กระทบการทำงานหลัก
  }
}; 