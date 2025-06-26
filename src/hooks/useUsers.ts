
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Hook สำหรับดึงข้อมูลสมาชิก
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};

// Hook สำหรับดึงข้อมูลสมาชิกที่รออนุมัติ
export const usePendingUsers = () => {
  return useQuery({
    queryKey: ['pending-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('status', 'pending')
        .in('user_type', ['employee', 'dependent'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};
