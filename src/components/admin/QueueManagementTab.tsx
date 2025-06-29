import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QueueItem } from './QueueItem';
import type { Database } from '@/integrations/supabase/types';

type Queue = Database['public']['Tables']['queues']['Row'] & {
  user?: Database['public']['Tables']['users']['Row'];
  payment?: Database['public']['Tables']['payments']['Row'][];
};

type Locker = Database['public']['Tables']['lockers']['Row'] & {
  user?: Database['public']['Tables']['users']['Row'];
  queue?: Database['public']['Tables']['queues']['Row'];
};

interface QueueManagementTabProps {
  activeQueues: Queue[];
  lockers: Locker[];
  onCallQueue: (queueId: string) => void;
  onStartService: (queueId: string) => void;
  onCompleteService: (queueId: string) => void;
  isLoading: boolean;
}

export const QueueManagementTab = ({ 
  activeQueues, 
  lockers,
  onCallQueue, 
  onStartService, 
  onCompleteService, 
  isLoading 
}: QueueManagementTabProps) => {
  // Sort queues by creation time (oldest first)
  const sortedQueues = [...activeQueues].sort((a, b) => {
    const timeA = a.booking_time || a.created_at;
    const timeB = b.booking_time || b.created_at;
    return new Date(timeA).getTime() - new Date(timeB).getTime();
  });

  // Get locker status by gender
  const getLockerStatusByGender = (gender: string) => {
    if (!lockers) return { available: 0, occupied: 0 };
    
    const genderPrefix = gender === 'male' ? 'ML' : gender === 'female' ? 'FL' : 'U';
    const genderLockers = lockers.filter(locker => 
      locker.locker_number.startsWith(genderPrefix)
    );
    
    return {
      available: genderLockers.filter(l => l.status === 'available').length,
      occupied: genderLockers.filter(l => l.status === 'occupied').length
    };
  };

  const maleLockers = getLockerStatusByGender('male');
  const femaleLockers = getLockerStatusByGender('female');
  const totalLockers = {
    available: lockers?.filter(l => l.status === 'available').length || 0,
    occupied: lockers?.filter(l => l.status === 'occupied').length || 0
  };

  return (
    <div className="space-y-6">
      {/* Locker Status */}
      <Card>
        <CardHeader>
          <CardTitle>สถานะตู้ล็อกเกอร์</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="font-semibold text-blue-800">ชาย (ML)</div>
              <div className="text-sm text-blue-600 mt-1">
                ว่าง: {maleLockers.available} | ใช้งาน: {maleLockers.occupied}
              </div>
            </div>
            
            <div className="p-4 bg-pink-50 rounded-lg">
              <div className="font-semibold text-pink-800">หญิง (FL)</div>
              <div className="text-sm text-pink-600 mt-1">
                ว่าง: {femaleLockers.available} | ใช้งาน: {femaleLockers.occupied}
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-800">รวมทั้งหมด</div>
              <div className="text-sm text-gray-600 mt-1">
                ว่าง: {totalLockers.available} | ใช้งาน: {totalLockers.occupied}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Management */}
      <Card>
        <CardHeader>
          <CardTitle>คิวที่ใช้งานอยู่ (เรียงตามเวลา)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedQueues.map((queue) => (
              <QueueItem
                key={queue.id}
                queue={queue}
                onCallQueue={onCallQueue}
                onStartService={onStartService}
                onCompleteService={onCompleteService}
                isLoading={isLoading}
              />
            ))}
            
            {sortedQueues.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                ไม่มีคิวที่ใช้งานอยู่
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
