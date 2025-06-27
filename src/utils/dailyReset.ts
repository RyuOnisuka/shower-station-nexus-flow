import { supabase } from '@/integrations/supabase/client';

// ฟังก์ชันสำหรับ daily reset
export const performDailyReset = async () => {
  try {
    // Clear all queues
    const { error: queueError } = await supabase
      .from('queues')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Keep at least one row

    if (queueError) {
      console.error('Error clearing queues:', queueError);
      return { success: false, message: 'เกิดข้อผิดพลาดในการลบคิว' };
    }

    // Reset all lockers to available
    const { error: lockerError } = await supabase
      .from('lockers')
      .update({ 
        status: 'available',
        user_id: null,
        queue_id: null,
        occupied_at: null
      });

    if (lockerError) {
      console.error('Error resetting lockers:', lockerError);
      return { success: false, message: 'เกิดข้อผิดพลาดในการรีเซ็ตตู้ล็อกเกอร์' };
    }

    // Clear all payments
    const { error: paymentError } = await supabase
      .from('payments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Keep at least one row

    if (paymentError) {
      console.error('Error clearing payments:', paymentError);
      return { success: false, message: 'เกิดข้อผิดพลาดในการลบการชำระเงิน' };
    }

    console.log('Daily reset completed successfully');
    return { success: true, message: 'Daily reset สำเร็จ' };
  } catch (error) {
    console.error('Daily reset error:', error);
    return { success: false, message: 'เกิดข้อผิดพลาดในการทำ Daily reset' };
  }
};

// Auto reset scheduler - runs every day at 12:00 AM
export const setupAutoReset = () => {
  const scheduleReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // 12:00 AM

    const timeUntilReset = tomorrow.getTime() - now.getTime();

    setTimeout(async () => {
      console.log('Performing scheduled daily reset...');
      await performDailyReset();
      
      // Schedule next reset (24 hours later)
      scheduleReset();
    }, timeUntilReset);
  };

  // Start the scheduler
  scheduleReset();
  
  console.log('Auto reset scheduler started - will reset daily at 12:00 AM');
};

// ฟังก์ชันตรวจสอบว่าต้องทำ daily reset หรือไม่
export const checkAndPerformDailyReset = async () => {
  try {
    // Get today's date
    const now = new Date();
    const thailandOffset = 7 * 60;
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const thailandTime = new Date(utc + (thailandOffset * 60000));
    const today = thailandTime.toISOString().split('T')[0];
    
    // ตรวจสอบว่ามี daily stats สำหรับวันนี้หรือไม่
    const { data: todayStats, error } = await supabase
      .from('daily_stats')
      .select('date')
      .eq('date', today)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking daily stats:', error);
      return false;
    }
    
    // ถ้าไม่มี stats สำหรับวันนี้ แสดงว่าต้องทำ reset
    if (!todayStats) {
      console.log('No daily stats found for today, performing reset...');
      return await performDailyReset();
    }
    
    return true;
    
  } catch (error) {
    console.error('Error checking daily reset:', error);
    return false;
  }
};

// Manual reset function (for admin use)
export const manualDailyReset = async () => {
  return await performDailyReset();
}; 