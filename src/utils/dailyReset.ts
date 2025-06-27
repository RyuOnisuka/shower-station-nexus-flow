import { supabase } from '@/integrations/supabase/client';

// ฟังก์ชันสำหรับ daily reset
export const performDailyReset = async () => {
  try {
    console.log('Performing daily reset...');
    
    // Get today's date in Thailand timezone
    const now = new Date();
    const thailandOffset = 7 * 60;
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const thailandTime = new Date(utc + (thailandOffset * 60000));
    const today = thailandTime.toISOString().split('T')[0];
    
    // ลบ queue เก่าที่ไม่เสร็จสิ้น (มากกว่า 1 วัน)
    const { error: deleteError } = await supabase
      .from('queues')
      .delete()
      .lt('created_at', `${today}T00:00:00+07:00`)
      .in('status', ['waiting', 'called', 'processing']);
    
    if (deleteError) {
      console.error('Error deleting old queues:', deleteError);
    } else {
      console.log('Old queues cleaned up successfully');
    }
    
    // รีเซ็ต locker ที่ยังถูกใช้งานอยู่
    const { error: lockerError } = await supabase
      .from('lockers')
      .update({ 
        current_queue_id: null,
        status: 'available',
        updated_at: new Date().toISOString()
      })
      .neq('status', 'maintenance');
    
    if (lockerError) {
      console.error('Error resetting lockers:', lockerError);
    } else {
      console.log('Lockers reset successfully');
    }
    
    // สร้าง daily stats record สำหรับวันใหม่
    const { error: statsError } = await supabase
      .from('daily_stats')
      .upsert({
        date: today,
        total_queues: 0,
        completed_queues: 0,
        cancelled_queues: 0,
        total_revenue: 0,
        peak_hour: null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'date'
      });
    
    if (statsError) {
      console.error('Error creating daily stats:', statsError);
    } else {
      console.log('Daily stats created successfully');
    }
    
    console.log('Daily reset completed successfully');
    return true;
    
  } catch (error) {
    console.error('Error in daily reset:', error);
    return false;
  }
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

// ฟังก์ชันสำหรับ manual reset (สำหรับ admin)
export const manualDailyReset = async () => {
  try {
    const success = await performDailyReset();
    if (success) {
      return { success: true, message: 'Daily reset completed successfully' };
    } else {
      return { success: false, message: 'Failed to perform daily reset' };
    }
  } catch (error) {
    return { success: false, message: 'Error performing daily reset' };
  }
}; 