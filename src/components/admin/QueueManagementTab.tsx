
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QueueItem } from './QueueItem';
import type { Database } from '@/integrations/supabase/types';

type Queue = Database['public']['Tables']['queues']['Row'] & {
  user?: Database['public']['Tables']['users']['Row'];
  payment?: Database['public']['Tables']['payments']['Row'][];
};

interface QueueManagementTabProps {
  activeQueues: Queue[];
  onCallQueue: (queueId: string) => void;
  onStartService: (queueId: string) => void;
  onCompleteService: (queueId: string) => void;
  isLoading: boolean;
}

export const QueueManagementTab = ({ 
  activeQueues, 
  onCallQueue, 
  onStartService, 
  onCompleteService, 
  isLoading 
}: QueueManagementTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>คิวที่ใช้งานอยู่</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activeQueues.map((queue) => (
            <QueueItem
              key={queue.id}
              queue={queue}
              onCallQueue={onCallQueue}
              onStartService={onStartService}
              onCompleteService={onCompleteService}
              isLoading={isLoading}
            />
          ))}
          
          {activeQueues.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              ไม่มีคิวที่ใช้งานอยู่
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
