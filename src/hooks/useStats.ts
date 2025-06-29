import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ฟังก์ชันสำหรับสร้างหรืออัปเดตข้อมูลสถิติรายวัน
export const updateDailyStats = async () => {
  try {
    // Get today's date in Thailand timezone
    const now = new Date();
    const thailandOffset = 7 * 60;
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const thailandTime = new Date(utc + (thailandOffset * 60000));
    const today = thailandTime.toISOString().split('T')[0];
    
    const startOfDay = `${today}T00:00:00.000+07:00`;
    const endOfDay = `${today}T23:59:59.999+07:00`;
    
    // Get today's queues
    const { data: todayQueues, error: queueError } = await supabase
      .from('queues')
      .select('*')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);
    
    if (queueError) throw queueError;
    
    // Calculate statistics
    const totalQueues = todayQueues?.length || 0;
    const completedQueues = todayQueues?.filter(q => q.status === 'completed').length || 0;
    const cancelledQueues = todayQueues?.filter(q => q.status === 'cancelled').length || 0;
    
    // Calculate total revenue from completed queues
    const totalRevenue = todayQueues
      ?.filter(q => q.status === 'completed')
      .reduce((sum, q) => sum + (q.price || 0), 0) || 0;
    
    // Find peak hour (hour with most queues)
    const hourCounts: { [key: number]: number } = {};
    todayQueues?.forEach(queue => {
      const hour = new Date(queue.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const peakHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || null;
    
    // Check if daily stats for today exists
    const { data: existingStats } = await supabase
      .from('daily_stats')
      .select('id')
      .eq('date', today)
      .maybeSingle();
    
    if (existingStats) {
      // Update existing stats
      const { error: updateError } = await supabase
        .from('daily_stats')
        .update({
          total_queues: totalQueues,
          completed_queues: completedQueues,
          cancelled_queues: cancelledQueues,
          total_revenue: totalRevenue,
          peak_hour: peakHour ? parseInt(peakHour) : null,
          updated_at: new Date().toISOString()
        })
        .eq('date', today);
      
      if (updateError) throw updateError;
    } else {
      // Create new stats
      const { error: insertError } = await supabase
        .from('daily_stats')
        .insert({
          date: today,
          total_queues: totalQueues,
          completed_queues: completedQueues,
          cancelled_queues: cancelledQueues,
          total_revenue: totalRevenue,
          peak_hour: peakHour ? parseInt(peakHour) : null
        });
      
      if (insertError) throw insertError;
    }
    
    console.log('Daily stats updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating daily stats:', error);
    return false;
  }
};

// Hook สำหรับดึงสถิติรายวัน
export const useDailyStats = () => {
  return useQuery({
    queryKey: ['daily_stats'],
    queryFn: async () => {
      // Update stats before fetching
      await updateDailyStats();
      
      const { data, error } = await supabase
        .from('daily_stats')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000, // Refresh ทุก 5 วินาที
    staleTime: 0, // ข้อมูลเก่าทันที
  });
};
