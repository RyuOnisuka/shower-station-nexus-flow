import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Phone, Droplets, Toilet } from 'lucide-react';
import { QueueTimeTracker } from '@/components/QueueTimeTracker';
import { getQueueDisplayName } from '@/utils/queueUtils';
import type { Database } from '@/integrations/supabase/types';

type Queue = Database['public']['Tables']['queues']['Row'] & {
  user?: Database['public']['Tables']['users']['Row'];
};

interface QueueItemProps {
  queue: Queue;
  onCallQueue: (queueId: string) => void;
  onStartService: (queueId: string) => void;
  onCompleteService: (queueId: string) => void;
  isLoading: boolean;
}

export const QueueItem = ({ 
  queue, 
  onCallQueue, 
  onStartService, 
  onCompleteService, 
  isLoading 
}: QueueItemProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'called': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'รอเรียก';
      case 'called': return 'เรียกแล้ว';
      case 'processing': return 'กำลังใช้บริการ';
      case 'completed': return 'เสร็จสิ้น';
      default: return status;
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'shower': return <Droplets className="h-4 w-4 text-blue-600" />;
      case 'toilet': return <Toilet className="h-4 w-4 text-green-600" />;
      default: return <Droplets className="h-4 w-4 text-blue-600" />;
    }
  };

  const getServiceText = (serviceType: string) => {
    switch (serviceType) {
      case 'shower': return 'อาบน้ำ';
      case 'toilet': return 'ห้องน้ำ';
      default: return 'อาบน้ำ';
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-blue-600">
                {queue.queue_number}
              </h3>
              {getServiceIcon(queue.service_type)}
            </div>
            <div className="text-sm text-gray-600 mb-1">
              {getQueueDisplayName(queue.queue_number)}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <User className="h-4 w-4" />
              {queue.user?.first_name} {queue.user?.last_name}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              {queue.user?.phone_number}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge className={getStatusColor(queue.status)}>
              {getStatusText(queue.status)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {getServiceText(queue.service_type)}
            </Badge>
            {queue.locker_number && (
              <Badge variant="outline">
                ตู้: {queue.locker_number}
              </Badge>
            )}
            <QueueTimeTracker 
              startedAt={queue.started_at} 
              status={queue.status} 
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <Clock className="h-4 w-4" />
          สร้างเมื่อ: {new Date(queue.created_at).toLocaleString('th-TH')}
          {queue.booking_time && (
            <>
              <span className="mx-2">•</span>
              จองเวลา: {new Date(queue.booking_time).toLocaleTimeString('th-TH', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </>
          )}
        </div>

        <div className="flex gap-2">
          {queue.status === 'waiting' && (
            <Button
              onClick={() => onCallQueue(queue.id)}
              disabled={isLoading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              เรียกคิว
            </Button>
          )}
          
          {queue.status === 'called' && (
            <Button
              onClick={() => onStartService(queue.id)}
              disabled={isLoading}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              เริ่มบริการ
            </Button>
          )}
          
          {queue.status === 'processing' && (
            <Button
              onClick={() => onCompleteService(queue.id)}
              disabled={isLoading}
              size="sm"
              className="bg-gray-600 hover:bg-gray-700"
            >
              เสร็จสิ้น
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
