
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { generateQueueNumber, getPriceByUserType } from '@/utils/queueUtils';

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

// Hook สำหรับสร้างคิวใหม่ - Enhanced with better error handling and booking support
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
      user_type?: string;
      booking_time?: string;
    }) => {
      console.log('Creating queue with userData:', userData);
      
      try {
        // Validate required fields
        if (!userData.phone_number || !userData.first_name || !userData.last_name) {
          throw new Error('Missing required user information');
        }
        
        // สร้างหรือหาผู้ใช้
        let user;
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('phone_number', userData.phone_number)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching user:', fetchError);
          throw new Error('Failed to check existing user');
        }

        if (existingUser) {
          user = existingUser;
          console.log('Found existing user:', user);
        } else {
          console.log('Creating new user...');
          const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert({
              phone_number: userData.phone_number,
              first_name: userData.first_name,
              last_name: userData.last_name,
              gender: userData.gender || 'unspecified',
              restroom_pref: userData.restroom_pref || 'male',
              user_type: userData.user_type || 'general'
            })
            .select()
            .single();
          
          if (userError) {
            console.error('User creation error:', userError);
            throw new Error(`Failed to create user: ${userError.message}`);
          }
          user = newUser;
          console.log('Created new user:', user);
        }

        // Generate queue number based on user's gender and service type
        const queueNumber = await generateQueueNumber(
          user.gender || 'unspecified', 
          userData.service_type || 'walkin'
        );
        
        console.log('Generated queue number:', queueNumber);

        // Calculate price based on user type
        const price = getPriceByUserType(user.user_type || 'general');

        // Prepare queue data
        const queueData: any = {
          queue_number: queueNumber,
          user_id: user.id,
          service_type: 'shower', // Always use 'shower' for database constraint
          price: price
        };

        // Add booking time if provided
        if (userData.booking_time && userData.service_type === 'booking') {
          // Convert booking time to full datetime for today
          const today = new Date().toISOString().split('T')[0];
          queueData.booking_time = `${today}T${userData.booking_time}:00`;
          console.log('Added booking time:', queueData.booking_time);
        }

        console.log('Creating queue with data:', queueData);

        // สร้างคิว
        const { data: queue, error: queueError } = await supabase
          .from('queues')
          .insert(queueData)
          .select()
          .single();

        if (queueError) {
          console.error('Queue creation error:', queueError);
          throw new Error(`Failed to create queue: ${queueError.message}`);
        }
        
        console.log('Created queue successfully:', queue);
        return queue;
        
      } catch (error) {
        console.error('Error in useCreateQueue mutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error('Queue creation failed:', error);
    }
  });
};

// Hook สำหรับอัปเดตสถานะคิว - Enhanced with gender-based locker assignment
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
        
        // Auto-assign available locker based on user's gender and restroom preference
        const { data: queueWithUser } = await supabase
          .from('queues')
          .select(`
            *,
            user:users(gender, restroom_pref)
          `)
          .eq('id', queueId)
          .single();

        if (queueWithUser?.user) {
          const userGender = queueWithUser.user.gender;
          const restroomPref = queueWithUser.user.restroom_pref;
          
          // Determine section based on gender first, then restroom preference
          let section = '';
          if (userGender === 'male') {
            section = 'Male';
          } else if (userGender === 'female') {
            section = 'Female';
          } else if (restroomPref === 'male') {
            section = 'Male';
          } else if (restroomPref === 'female') {
            section = 'Female';
          } else {
            section = 'Male'; // Default fallback
          }
          
          console.log(`Assigning locker for user with gender: ${userGender}, restroom_pref: ${restroomPref}, section: ${section}`);
          
          const { data: availableLocker } = await supabase
            .from('lockers')
            .select('*')
            .eq('status', 'available')
            .ilike('location', `%${section}%`)
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
              
            console.log(`Assigned locker ${availableLocker.locker_number} to queue ${queueId}`);
          } else {
            console.log(`No available lockers in ${section} section`);
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
