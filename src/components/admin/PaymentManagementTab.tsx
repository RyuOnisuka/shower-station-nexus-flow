
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentItem } from './PaymentItem';
import type { Database } from '@/integrations/supabase/types';

type Queue = Database['public']['Tables']['queues']['Row'] & {
  user?: Database['public']['Tables']['users']['Row'];
  payment?: Database['public']['Tables']['payments']['Row'][];
};

interface PaymentManagementTabProps {
  pendingPaymentQueues: Queue[];
  onApprovePayment: (queueId: string) => void;
  isLoading: boolean;
}

export const PaymentManagementTab = ({ 
  pendingPaymentQueues, 
  onApprovePayment, 
  isLoading 
}: PaymentManagementTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>รอตรวจสอบการชำระเงิน</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pendingPaymentQueues.map((queue) => (
            <PaymentItem
              key={queue.id}
              queue={queue}
              onApprovePayment={onApprovePayment}
              isLoading={isLoading}
            />
          ))}
          
          {pendingPaymentQueues.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              ไม่มีการชำระเงินที่รอตรวจสอบ
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
