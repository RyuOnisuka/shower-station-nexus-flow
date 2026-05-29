import { Card } from '@/components/ui/card';
import { getLockerStatusColor, getLockerStatusText } from '@/utils/statusUtils';
import type { Database } from '@/integrations/supabase/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type Locker = Database['public']['Tables']['lockers']['Row'] & {
  user?: Database['public']['Tables']['users']['Row'];
  queue?: Database['public']['Tables']['queues']['Row'];
};

interface LockerCardProps {
  locker: Locker;
}

export const LockerCard = ({ locker }: LockerCardProps) => {
  const queryClient = useQueryClient();

  const handleStatusChange = async (newStatus: 'available' | 'occupied' | 'maintenance') => {
    try {
      const { error } = await supabase
        .from('lockers')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', locker.id);

      if (error) throw error;
      
      toast.success(`อัปเดตตู้ ${locker.locker_number} เป็น ${getLockerStatusText(newStatus)} สำเร็จ`);
      
      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['lockers'] });
      queryClient.invalidateQueries({ queryKey: ['queues'] });
    } catch (error) {
      console.error('Error updating locker status:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  return (
    <Card className={`p-4 text-center ${getLockerStatusColor(locker.status || 'available')}`}>
      <div className="font-bold text-lg">{locker.locker_number}</div>
      <div className="text-sm text-gray-600">{locker.location}</div>
      
      {locker.status === 'occupied' && locker.user && (
        <div className="mt-2 text-xs text-gray-700">
          <div>ผู้ใช้: {locker.user.first_name} {locker.user.last_name}</div>
          {locker.queue && (
            <div>คิว: {locker.queue.queue_number}</div>
          )}
        </div>
      )}
      
      <div className="mt-3 flex justify-center">
        <Select 
          value={locker.status || 'available'} 
          onValueChange={(val) => handleStatusChange(val as any)}
        >
          <SelectTrigger className="w-full h-8 text-xs bg-white border border-gray-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available" className="text-xs">ว่าง (Available)</SelectItem>
            <SelectItem value="occupied" className="text-xs">ใช้งานอยู่ (Occupied)</SelectItem>
            <SelectItem value="maintenance" className="text-xs">ชำรุด (Maintenance)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
};
