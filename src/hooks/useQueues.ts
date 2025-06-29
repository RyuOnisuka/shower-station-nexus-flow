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

// Enhanced queue creation with better error handling and retry logic
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
      
      // Validate required fields
      if (!userData.phone_number || !userData.first_name || !userData.last_name) {
        throw new Error('Missing required user information');
      }
      
      // Retry logic for queue creation
      const maxRetries = 3;
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Queue creation attempt ${attempt}/${maxRetries}`);
          
          // Find or create user
          let user;
          const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('phone_number', userData.phone_number)
            .maybeSingle();

          if (fetchError) {
            console.error('Error fetching user:', fetchError);
            throw new Error(`Failed to check existing user: ${fetchError.message}`);
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

          // Generate queue number with retry built-in
          const queueNumber = await generateQueueNumber(
            user.gender || 'male', 
            userData.service_type || 'shower'
          );
          
          console.log('Generated queue number:', queueNumber);

          // Calculate price based on user type
          const price = getPriceByUserType(user.user_type || 'general');

          // Prepare queue data
          const queueData: any = {
            queue_number: queueNumber,
            user_id: user.id,
            service_type: userData.service_type || 'shower',
            price: price
          };

          // Add booking time if provided
          if (userData.booking_time) {
            const today = new Date().toISOString().split('T')[0];
            queueData.booking_time = `${today}T${userData.booking_time}:00+07:00`;
            console.log('Added booking time:', queueData.booking_time);
          }

          console.log('Creating queue with data:', queueData);

          // Create queue with specific error handling
          const { data: queue, error: queueError } = await supabase
            .from('queues')
            .insert(queueData)
            .select()
            .single();

          if (queueError) {
            console.error('Queue creation error:', queueError);
            
            // Handle specific error types
            if (queueError.code === '23505') { // Unique constraint violation
              console.log('Duplicate queue number detected, retrying...');
              if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 200 * attempt)); // Progressive delay
                continue; // Retry
              } else {
                throw new Error('Unable to generate unique queue number after multiple attempts');
              }
            } else {
              throw new Error(`Failed to create queue: ${queueError.message}`);
            }
          }
          
          console.log('Created queue successfully:', queue);
          return queue;
          
        } catch (error) {
          console.error(`Queue creation attempt ${attempt} failed:`, error);
          lastError = error as Error;
          
          // If it's not a duplicate key error, don't retry
          if ((error as any)?.code !== '23505' && !(error as Error)?.message?.includes('duplicate')) {
            throw error;
          }
          
          // If this was the last attempt, throw the error
          if (attempt === maxRetries) {
            throw lastError;
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 300 * attempt));
        }
      }
      
      throw lastError || new Error('Queue creation failed after all retries');
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

// Hook สำหรับอัปเดตสถานะคิว - Enhanced with time tracking for 3-hour limit
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

// Hook สำหรับตรวจสอบและมอบหมาย locker อัตโนมัติ
export const useAutoAssignLocker = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      try {
        // หา queues ที่ชำระเงินแล้วแต่ยังไม่มี locker (status = 'called')
        const { data: waitingQueues, error: queueError } = await supabase
          .from('queues')
          .select(`
            *,
            user:users(*),
            payment:payments(*)
          `)
          .eq('status', 'called')
          .is('locker_number', null);

        if (queueError) throw queueError;

        if (!waitingQueues || waitingQueues.length === 0) {
          return { assigned: 0, message: 'ไม่มีคิวที่รอ locker' };
        }

        let assignedCount = 0;
        const results = [];

        for (const queue of waitingQueues) {
          // ตรวจสอบว่ามีการชำระเงินที่อนุมัติแล้วหรือไม่
          const hasApprovedPayment = queue.payment?.some((p: any) => p.status === 'approved');
          if (!hasApprovedPayment) continue;

          // กำหนดประเภท locker ตาม gender
          let gender = 'unisex';
          if (queue.user?.gender === 'male') {
            gender = 'male';
          } else if (queue.user?.gender === 'female') {
            gender = 'female';
          } else if (queue.user?.restroom_pref === 'male') {
            gender = 'male';
          } else if (queue.user?.restroom_pref === 'female') {
            gender = 'female';
          }

          const lockerPrefix = gender === 'male' ? 'ML' : gender === 'female' ? 'FL' : null;
          if (!lockerPrefix) continue;

          // หา locker ว่าง
          const { data: availableLockers } = await supabase
            .from('lockers')
            .select('*')
            .eq('status', 'available')
            .like('locker_number', `${lockerPrefix}%`)
            .order('locker_number')
            .limit(1);

          if (!availableLockers || availableLockers.length === 0) continue;

          const selectedLocker = availableLockers[0];

          // มอบหมาย locker
          const { error: lockerError } = await supabase
            .from('lockers')
            .update({
              status: 'occupied',
              user_id: queue.user_id,
              current_queue_id: queue.id,
              occupied_at: new Date().toISOString(),
              released_at: null
            })
            .eq('id', selectedLocker.id);

          if (lockerError) {
            console.error('Error assigning locker:', lockerError);
            continue;
          }

          // อัปเดต queue
          const { error: queueUpdateError } = await supabase
            .from('queues')
            .update({
              locker_number: selectedLocker.locker_number,
              status: 'processing'
            })
            .eq('id', queue.id);

          if (queueUpdateError) {
            console.error('Error updating queue:', queueUpdateError);
            continue;
          }

          assignedCount++;
          results.push({
            queueNumber: queue.queue_number,
            userName: `${queue.user?.first_name} ${queue.user?.last_name}`,
            lockerNumber: selectedLocker.locker_number
          });
        }

        return { 
          assigned: assignedCount, 
          results,
          message: assignedCount > 0 ? `มอบหมาย locker ให้ ${assignedCount} คิว` : 'ไม่มี locker ว่าง'
        };
      } catch (error) {
        console.error('Auto assign locker error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      queryClient.invalidateQueries({ queryKey: ['lockers'] });
      queryClient.invalidateQueries({ queryKey: ['daily_stats'] });
    }
  });
};
