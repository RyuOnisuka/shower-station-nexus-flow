import { supabase } from '@/integrations/supabase/client';

// Function to generate queue number with improved reliability
export const generateQueueNumber = async (gender: string, serviceType: string, retryCount = 0): Promise<string> => {
  const maxRetries = 3;
  
  try {
    const genderCode = gender === 'male' ? 'M' : 'F';
    const serviceCode = serviceType === 'shower' ? 'S' : 'T'; // S=Shower, T=Toilet
    
    // Get today's date in Thailand timezone (UTC+7)
    const now = new Date();
    const thailandOffset = 7 * 60; // Thailand is UTC+7
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const thailandTime = new Date(utc + (thailandOffset * 60000));
    const today = thailandTime.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log('Generating queue number for:', { gender, serviceType, today, genderCode, serviceCode });
    
    // Clean up old queues first (daily reset)
    await cleanupOldQueues(today);
    
    // Query today's queues for the specific gender and service type
    const startOfDay = `${today}T00:00:00.000+07:00`;
    const endOfDay = `${today}T23:59:59.999+07:00`;
    
    const { data: todayQueues, error } = await supabase
      .from('queues')
      .select('queue_number')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
      .like('queue_number', `${genderCode}${serviceCode}-%`)
      .order('queue_number', { ascending: false })
      .limit(1000); // เพิ่ม limit เพื่อรองรับ 999 queues
    
    if (error) {
      console.error('Error fetching today queues:', error);
      // Fallback: ใช้ timestamp
      const timestamp = Date.now();
      const fallbackSuffix = String(timestamp).slice(-3);
      return `${genderCode}${serviceCode}-${fallbackSuffix.padStart(3, '0')}`;
    }
    
    console.log('Today queues found:', todayQueues?.length || 0);
    
    // Find the highest existing number for today with same gender and service
    let highestNumber = 0;
    if (todayQueues && todayQueues.length > 0) {
      const pattern = new RegExp(`^${genderCode}${serviceCode}-(\\d{3})$`);
      todayQueues.forEach(queue => {
        const match = queue.queue_number.match(pattern);
        if (match) {
          const number = parseInt(match[1], 10);
          if (!isNaN(number) && number > highestNumber && number <= 999) {
            highestNumber = number;
          }
        }
      });
    }
    
    // Generate next number in sequence (001-999)
    let nextNumber = highestNumber + 1;
    if (nextNumber > 999) {
      // ถ้าเกิน 999 ให้เริ่มใหม่ที่ 001
      nextNumber = 1;
      console.log('Queue number exceeded 999, resetting to 001');
    }
    
    const queueNum = String(nextNumber).padStart(3, '0');
    const generatedNumber = `${genderCode}${serviceCode}-${queueNum}`;
    
    console.log('Generated queue number:', generatedNumber, 'from highest:', highestNumber);
    
    // Check if generated number already exists
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
        await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1)));
        return generateQueueNumber(gender, serviceType, retryCount + 1);
      } else {
        // ใช้ timestamp เป็น fallback
        const timestamp = Date.now();
        const fallbackSuffix = String(timestamp).slice(-3);
        return `${genderCode}${serviceCode}-${fallbackSuffix.padStart(3, '0')}`;
      }
    }
    
    return generatedNumber;
    
  } catch (error) {
    console.error('Error in generateQueueNumber:', error);
    
    if (retryCount < maxRetries) {
      console.log(`Retrying queue number generation (attempt ${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)));
      return generateQueueNumber(gender, serviceType, retryCount + 1);
    }
    
    // Final fallback
    const timestamp = Date.now();
    const fallbackSuffix = String(timestamp).slice(-3);
    return `${gender === 'male' ? 'M' : 'F'}${serviceType === 'shower' ? 'S' : 'T'}-${fallbackSuffix.padStart(3, '0')}`;
  }
};

// Function to clean up old queues - runs daily reset
const cleanupOldQueues = async (today: string) => {
  try {
    console.log('Cleaning up old queues for date:', today);
    
    // ลบ queue เก่าที่ไม่เสร็จสิ้น (มากกว่า 1 วัน)
    const { error } = await supabase
      .from('queues')
      .delete()
      .lt('created_at', `${today}T00:00:00+07:00`)
      .in('status', ['waiting', 'called', 'processing']); // เก็บ completed queues สำหรับประวัติ
    
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

// Function to get queue display name
export const getQueueDisplayName = (queueNumber: string): string => {
  const genderCode = queueNumber.charAt(0);
  const serviceCode = queueNumber.charAt(1);
  
  const genderText = genderCode === 'M' ? 'ชาย' : 'หญิง';
  const serviceText = serviceCode === 'S' ? 'อาบน้ำ' : 'ห้องน้ำ';
  
  return `${genderText} ${serviceText} ${queueNumber}`;
};

// Function to get queue statistics for today
export const getTodayQueueStats = async () => {
  const now = new Date();
  const thailandOffset = 7 * 60;
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const thailandTime = new Date(utc + (thailandOffset * 60000));
  const today = thailandTime.toISOString().split('T')[0];
  
  const startOfDay = `${today}T00:00:00.000+07:00`;
  const endOfDay = `${today}T23:59:59.999+07:00`;
  
  const { data: todayQueues, error } = await supabase
    .from('queues')
    .select('queue_number, status')
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay);
  
  if (error) {
    console.error('Error fetching today queue stats:', error);
    return null;
  }
  
  const stats = {
    total: 0,
    maleShower: 0,
    maleToilet: 0,
    femaleShower: 0,
    femaleToilet: 0,
    waiting: 0,
    processing: 0,
    completed: 0
  };
  
  todayQueues?.forEach(queue => {
    stats.total++;
    
    if (queue.queue_number.startsWith('MS-')) stats.maleShower++;
    else if (queue.queue_number.startsWith('MT-')) stats.maleToilet++;
    else if (queue.queue_number.startsWith('FS-')) stats.femaleShower++;
    else if (queue.queue_number.startsWith('FT-')) stats.femaleToilet++;
    
    if (queue.status === 'waiting') stats.waiting++;
    else if (queue.status === 'processing') stats.processing++;
    else if (queue.status === 'completed') stats.completed++;
  });
  
  return stats;
};
