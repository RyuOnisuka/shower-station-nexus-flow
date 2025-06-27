
import { supabase } from '@/integrations/supabase/client';

// Function to generate queue number with improved reliability
export const generateQueueNumber = async (gender: string, serviceType: string, retryCount = 0): Promise<string> => {
  const maxRetries = 3;
  
  try {
    const genderCode = gender === 'male' ? 'M' : 'F';
    const serviceCode = serviceType === 'walkin' ? 'W' : 'B';
    
    // Get today's date in Thailand timezone (UTC+7)
    const now = new Date();
    const thailandOffset = 7 * 60; // Thailand is UTC+7
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const thailandTime = new Date(utc + (thailandOffset * 60000));
    const today = thailandTime.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log('Generating queue number for:', { gender, serviceType, today, genderCode, serviceCode });
    
    // Clean up old queues first
    await cleanupOldQueues(today);
    
    // Use a more specific timestamp to avoid collisions
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    
    // Query today's queues for the specific gender and service type with more precise filtering
    const startOfDay = `${today}T00:00:00.000+07:00`;
    const endOfDay = `${today}T23:59:59.999+07:00`;
    
    const { data: todayQueues, error } = await supabase
      .from('queues')
      .select('queue_number')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
      .like('queue_number', `${genderCode}${serviceCode}-%`)
      .order('queue_number', { ascending: false })
      .limit(50); // Limit for performance
    
    if (error) {
      console.error('Error fetching today queues:', error);
      // Enhanced fallback with more randomness
      const fallbackSuffix = String(timestamp).slice(-6) + String(randomSuffix).padStart(3, '0');
      return `${genderCode}${serviceCode}-${fallbackSuffix}`;
    }
    
    console.log('Today queues found:', todayQueues?.length || 0);
    
    // Find the highest existing number for today with same gender and service
    let highestNumber = 0;
    if (todayQueues && todayQueues.length > 0) {
      const pattern = new RegExp(`^${genderCode}${serviceCode}-(\\d+)$`);
      todayQueues.forEach(queue => {
        const match = queue.queue_number.match(pattern);
        if (match) {
          const number = parseInt(match[1], 10);
          if (!isNaN(number) && number > highestNumber && number < 1000) { // Ensure within 001-999 range
            highestNumber = number;
          }
        }
      });
    }
    
    // Generate next number in sequence (001-999)
    let nextNumber = highestNumber + 1;
    if (nextNumber > 999) {
      nextNumber = 1; // Reset to 1 if we exceed 999
    }
    
    const queueNum = String(nextNumber).padStart(3, '0');
    const generatedNumber = `${genderCode}${serviceCode}-${queueNum}`;
    
    console.log('Generated queue number:', generatedNumber, 'from highest:', highestNumber);
    
    // Check if generated number already exists (with timeout)
    const checkPromise = supabase
      .from('queues')
      .select('id')
      .eq('queue_number', generatedNumber)
      .maybeSingle();
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Check timeout')), 5000)
    );
    
    try {
      const { data: existingQueue, error: checkError } = await Promise.race([
        checkPromise,
        timeoutPromise
      ]) as any;
      
      if (checkError && checkError.message !== 'Check timeout') {
        console.error('Error checking existing queue:', checkError);
      }
      
      if (existingQueue) {
        console.log('Generated number already exists, retrying...');
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1))); // Short delay
          return generateQueueNumber(gender, serviceType, retryCount + 1);
        } else {
          // Use timestamp-based fallback after max retries
          const fallbackSuffix = String(timestamp).slice(-6) + String(randomSuffix).padStart(3, '0');
          return `${genderCode}${serviceCode}-${fallbackSuffix}`;
        }
      }
    } catch (timeoutError) {
      console.log('Check timeout, proceeding with generated number');
    }
    
    return generatedNumber;
    
  } catch (error) {
    console.error('Error in generateQueueNumber:', error);
    
    if (retryCount < maxRetries) {
      console.log(`Retrying queue number generation (attempt ${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1))); // Exponential backoff
      return generateQueueNumber(gender, serviceType, retryCount + 1);
    }
    
    // Final fallback with enhanced uniqueness
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 10000);
    const fallbackSuffix = String(timestamp).slice(-6) + String(randomSuffix).padStart(4, '0');
    return `${gender === 'male' ? 'M' : 'F'}${serviceType === 'walkin' ? 'W' : 'B'}-${fallbackSuffix}`;
  }
};

// Function to clean up old queues - runs daily reset
const cleanupOldQueues = async (today: string) => {
  try {
    console.log('Cleaning up old queues for date:', today);
    
    // Delete old queues (more than 1 day old) that are not completed
    const { error } = await supabase
      .from('queues')
      .delete()
      .lt('created_at', `${today}T00:00:00+07:00`)
      .in('status', ['waiting', 'called', 'processing']); // Keep completed queues for history
    
    if (error) {
      console.error('Error cleaning up old queues:', error);
    } else {
      console.log('Old queues cleaned up successfully');
    }
  } catch (error) {
    console.error('Error in cleanupOldQueues:', error);
  }
};

// Function to get price based on user type
export const getPriceByUserType = (userType: string): number => {
  switch (userType) {
    case 'employee': return 50;
    case 'dependent': return 70;
    default: return 100; // general
  }
};
