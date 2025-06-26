
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Hook สำหรับดึงข้อมูล locker
export const useLockers = () => {
  return useQuery({
    queryKey: ['lockers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lockers')
        .select('*')
        .order('locker_number');
      
      if (error) throw error;
      return data;
    }
  });
};
