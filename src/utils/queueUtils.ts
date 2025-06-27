
import { supabase } from '@/integrations/supabase/client';

// Function to generate queue number - Enhanced error handling and retry logic
export const generateQueueNumber = async (gender: string, serviceType: string, retryCount = 0): Promise<string> => {
  const maxRetries = 5;
  
  try {
    const genderCode = gender === 'male' ? 'M' : 'F';
    const serviceCode = serviceType === 'walkin' ? 'W' : 'B';
    
    // Get today's date in Thailand timezone (UTC+7)
    const now = new Date();
    const thailandOffset = 7 * 60; // Thailand is UTC+7
    const thailandTime = new Date(now.getTime() + (thailandOffset * 60000));
    const today = thailandTime.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log('Generating queue number for:', { gender, serviceType, today, genderCode, serviceCode });
    
    // Query today's queues using date comparison instead of timestamp
    const { data: todayQueues, error } = await supabase
      .from('queues')
      .select('queue_number')
      .gte('created_at', `${today}T00:00:00+00:00`)
      .lt('created_at', `${today}T23:59:59+00:00`)
      .like('queue_number', `${genderCode}${serviceCode}-%`)
      .order('queue_number', { ascending: false });
    
    if (error) {
      console.error('Error fetching today queues:', error);
      // Fallback: use timestamp-based number
      const timestamp = Date.now().toString().slice(-4);
      const randomSuffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      return `${genderCode}${serviceCode}-${timestamp}${randomSuffix}`;
    }
    
    console.log('Today queues found:', todayQueues?.length || 0, todayQueues);
    
    // Find the highest existing number for today with same gender and service
    let highestNumber = 0;
    if (todayQueues && todayQueues.length > 0) {
      const pattern = new RegExp(`^${genderCode}${serviceCode}-(\\d+)$`);
      todayQueues.forEach(queue => {
        const match = queue.queue_number.match(pattern);
        if (match) {
          const number = parseInt(match[1], 10);
          if (!isNaN(number) && number > highestNumber) {
            highestNumber = number;
          }
        }
      });
    }
    
    const nextNumber = highestNumber + 1;
    const queueNum = String(nextNumber).padStart(3, '0');
    const generatedNumber = `${genderCode}${serviceCode}-${queueNum}`;
    
    console.log('Generated queue number:', generatedNumber, 'from highest:', highestNumber);
    
    // Double check if the generated number already exists
    const { data: existingQueue, error: checkError } = await supabase
      .from('queues')
      .select('id')
      .eq('queue_number', generatedNumber)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking existing queue:', checkError);
    }
    
    if (existingQueue) {
      console.log('Generated number already exists, retrying...');
      if (retryCount < maxRetries) {
        return generateQueueNumber(gender, serviceType, retryCount + 1);
      }
    }
    
    return generatedNumber;
    
  } catch (error) {
    console.error('Error in generateQueueNumber:', error);
    
    if (retryCount < maxRetries) {
      console.log(`Retrying queue number generation (attempt ${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
      return generateQueueNumber(gender, serviceType, retryCount + 1);
    }
    
    // Final fallback with timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${gender === 'male' ? 'M' : 'F'}${serviceType === 'walkin' ? 'W' : 'B'}-${timestamp}${randomSuffix}`;
  }
};

// Function to get price based on user type
export const getPriceByUserType = (userType: string): number => {
  switch (userType) {
    case 'employee': return 50;
    case 'follower': return 70;
    default: return 100; // general
  }
};
