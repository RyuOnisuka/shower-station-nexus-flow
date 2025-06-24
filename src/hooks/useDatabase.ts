
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

// Hook สำหรับดึงข้อมูลคิว
export const useQueues = () => {
  return useQuery({
    queryKey: ['queues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('queues')
        .select(`
          *,
          user:users(*),
          payment:payments(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};

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

// Hook สำหรับดึงสถิติรายวัน
export const useDailyStats = () => {
  return useQuery({
    queryKey: ['daily_stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_stats')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      return data;
    }
  });
};

// Hook สำหรับสร้างคิวใหม่
export const useCreateQueue = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: { 
      phone_number: string;
      first_name: string;
      last_name: string;
      gender?: string;
      restroom_pref?: string;
    }) => {
      // สร้างหรือหาผู้ใช้
      let user;
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', userData.phone_number)
        .single();

      if (existingUser) {
        user = existingUser;
      } else {
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert(userData)
          .select()
          .single();
        
        if (userError) throw userError;
        user = newUser;
      }

      // สร้างหมายเลขคิว
      const queueNumber = `MW-${String(Date.now()).slice(-3)}`;

      // สร้างคิว
      const { data: queue, error: queueError } = await supabase
        .from('queues')
        .insert({
          queue_number: queueNumber,
          user_id: user.id,
          price: 50.00
        })
        .select()
        .single();

      if (queueError) throw queueError;
      return queue;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
};

// Hook สำหรับอัปเดตสถานะคิว
export const useUpdateQueueStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ queueId, status, lockerNumber }: {
      queueId: string;
      status: string;
      lockerNumber?: string;
    }) => {
      const updateData: any = { status };
      
      if (status === 'called') {
        updateData.called_at = new Date().toISOString();
      } else if (status === 'processing') {
        updateData.started_at = new Date().toISOString();
        if (lockerNumber) updateData.locker_number = lockerNumber;
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('queues')
        .update(updateData)
        .eq('id', queueId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      queryClient.invalidateQueries({ queryKey: ['lockers'] });
    }
  });
};
