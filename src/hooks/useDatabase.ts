
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

// Function to generate queue number
const generateQueueNumber = async (gender: string, serviceType: string): Promise<string> => {
  const genderCode = gender === 'male' ? 'M' : 'F';
  const serviceCode = serviceType === 'walkin' ? 'W' : 'B';
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Get count of today's queues with same gender and service type
  const { data: todayQueues, error } = await supabase
    .from('queues')
    .select('queue_number')
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lt('created_at', `${today}T23:59:59.999Z`)
    .ilike('queue_number', `${genderCode}${serviceCode}-%`);
  
  if (error) {
    console.error('Error fetching today queues:', error);
    // Fallback to random number if query fails
    const queueNum = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    return `${genderCode}${serviceCode}-${queueNum}`;
  }
  
  const nextNumber = (todayQueues?.length || 0) + 1;
  const queueNum = String(nextNumber).padStart(3, '0');
  
  return `${genderCode}${serviceCode}-${queueNum}`;
};

// Hook สำหรับสร้างคิวใหม่ - Updated with new queue logic
export const useCreateQueue = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: { 
      phone_number: string;
      first_name: string;
      last_name: string;
      gender?: string;
      restroom_pref?: string;
      service_type?: string;
    }) => {
      console.log('Creating queue with userData:', userData);
      
      // สร้างหรือหาผู้ใช้
      let user;
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', userData.phone_number)
        .single();

      if (existingUser) {
        user = existingUser;
        console.log('Found existing user:', user);
      } else {
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            phone_number: userData.phone_number,
            first_name: userData.first_name,
            last_name: userData.last_name,
            gender: userData.gender || 'unspecified',
            restroom_pref: userData.restroom_pref || 'male'
          })
          .select()
          .single();
        
        if (userError) {
          console.error('User creation error:', userError);
          throw userError;
        }
        user = newUser;
        console.log('Created new user:', user);
      }

      // สร้างหมายเลขคิวตามเพศและประเภทการใช้งาน
      const queueNumber = await generateQueueNumber(
        user.gender || 'unspecified', 
        userData.service_type || 'shower'
      );
      
      console.log('Generated queue number:', queueNumber);

      // สร้างคิว - ใช้ 'shower' เป็น default service_type เพื่อให้ตรงกับ database constraint
      const finalServiceType = userData.service_type === 'walkin' ? 'shower' : 
                              userData.service_type === 'booking' ? 'shower' : 'shower';

      const { data: queue, error: queueError } = await supabase
        .from('queues')
        .insert({
          queue_number: queueNumber,
          user_id: user.id,
          service_type: finalServiceType,
          price: 50.00
        })
        .select()
        .single();

      if (queueError) {
        console.error('Queue creation error:', queueError);
        throw queueError;
      }
      
      console.log('Created queue:', queue);
      return queue;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
};

// Hook สำหรับอัปเดตสถานะคิว - Updated with auto locker assignment
export const useUpdateQueueStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ queueId, status }: {
      queueId: string;
      status: string;
    }) => {
      const updateData: any = { status };
      
      if (status === 'called') {
        updateData.called_at = new Date().toISOString();
      } else if (status === 'processing') {
        updateData.started_at = new Date().toISOString();
        
        // Auto-assign available locker based on user's restroom preference
        const { data: queue } = await supabase
          .from('queues')
          .select('user:users(restroom_pref)')
          .eq('id', queueId)
          .single();

        if (queue?.user?.restroom_pref) {
          const location = queue.user.restroom_pref === 'male' 
            ? 'Floor 1 - Male Section'
            : 'Floor 1 - Female Section';
          
          const { data: availableLocker } = await supabase
            .from('lockers')
            .select('*')
            .eq('status', 'available')
            .ilike('location', `%${queue.user.restroom_pref === 'male' ? 'Male' : 'Female'}%`)
            .limit(1)
            .single();

          if (availableLocker) {
            updateData.locker_number = availableLocker.locker_number;
            
            // Update locker status
            await supabase
              .from('lockers')
              .update({ 
                status: 'occupied', 
                current_queue_id: queueId 
              })
              .eq('id', availableLocker.id);
          }
        }
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        
        // Free up the locker
        const { data: currentQueue } = await supabase
          .from('queues')
          .select('locker_number')
          .eq('id', queueId)
          .single();

        if (currentQueue?.locker_number) {
          await supabase
            .from('lockers')
            .update({ 
              status: 'available', 
              current_queue_id: null 
            })
            .eq('locker_number', currentQueue.locker_number);
        }
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
