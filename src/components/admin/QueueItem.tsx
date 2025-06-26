
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getStatusColor, getStatusText } from '@/utils/statusUtils';
import type { Database } from '@/integrations/supabase/types';

type Queue = Database['public']['Tables']['queues']['Row'] & {
  user?: Database['public']['Tables']['users']['Row'];
  payment?: Database['public']['Tables']['payments']['Row'][];
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
  const renderActionButtons = () => {
    if (queue.status === 'waiting') {
      return (
        <Button 
          size="sm" 
          onClick={() => onCallQueue(queue.id)}
          disabled={isLoading}
        >
          เรียกคิว
        </Button>
      );
    }
    
    if (queue.status === 'called') {
      return (
        <Button 
          size="sm"
          onClick={() => onStartService(queue.id)}
          disabled={isLoading}
        >
          เริ่มบริการ
        </Button>
      );
    }
    
    if (queue.status === 'processing') {
      return (
        <Button 
          size="sm"
          variant="outline"
          onClick={() => onCompleteService(queue.id)}
          disabled={isLoading}
        >
          บริการเสร็จ
        </Button>
      );
    }
    
    return null;
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center space-x-3">
          <Badge className={getStatusColor(queue.status)}>
            {getStatusText(queue.status)}
          </Badge>
          <span className="font-bold">{queue.queue_number}</span>
          <span>{queue.user?.first_name} {queue.user?.last_name}</span>
          {queue.locker_number && (
            <Badge variant="outline">ตู้: {queue.locker_number}</Badge>
          )}
          {queue.booking_time && (
            <Badge variant="secondary">
              จอง: {new Date(queue.booking_time).toLocaleTimeString('th-TH', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Badge>
          )}
        </div>
        <div className="text-sm text-gray-600 mt-1">
          เวลา: {new Date(queue.created_at).toLocaleTimeString('th-TH')} | 
          ราคา: ฿{queue.price}
        </div>
      </div>
      
      <div className="flex space-x-2">
        {renderActionButtons()}
      </div>
    </div>
  );
};
