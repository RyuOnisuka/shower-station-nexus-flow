import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Eye } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Queue = Database['public']['Tables']['queues']['Row'] & {
  user?: Database['public']['Tables']['users']['Row'];
  payment?: Database['public']['Tables']['payments']['Row'][];
};

interface PaymentItemProps {
  queue: Queue;
  onApprovePayment: (queueId: string) => void;
  isLoading: boolean;
}

export const PaymentItem = ({ queue, onApprovePayment, isLoading }: PaymentItemProps) => {
  const slipUrl = queue.payment?.[0]?.slip_url;

  const handleViewSlip = () => {
    if (slipUrl) {
      window.open(slipUrl, '_blank');
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center space-x-3">
          <span className="font-bold">{queue.queue_number}</span>
          <span>{queue.user?.first_name} {queue.user?.last_name}</span>
          <Badge variant="outline">฿{queue.price}</Badge>
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
          เวลาส่งสลิป: {new Date(queue.payment?.[0]?.created_at || '').toLocaleString('th-TH')}
        </div>
        {slipUrl && (
          <div className="text-sm text-blue-600 mt-1">
            <Button 
              variant="link" 
              size="sm" 
              className="p-0 h-auto text-blue-600 hover:text-blue-800"
              onClick={handleViewSlip}
            >
              <Eye className="h-3 w-3 mr-1" />
              ดูสลิปการโอนเงิน
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </div>
      
      <div className="flex space-x-2">
        <Button 
          size="sm"
          onClick={() => onApprovePayment(queue.id)}
          disabled={isLoading}
        >
          อนุมัติและเริ่มบริการ
        </Button>
        <Button size="sm" variant="outline">
          ปฏิเสธ
        </Button>
      </div>
    </div>
  );
};
