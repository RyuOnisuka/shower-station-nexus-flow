
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useQueues, useLockers, useUpdateQueueStatus, useDailyStats } from '@/hooks/useDatabase';
import { supabase } from '@/integrations/supabase/client';
import { QueueManagementTab } from '@/components/admin/QueueManagementTab';
import { PaymentManagementTab } from '@/components/admin/PaymentManagementTab';
import { LockerManagementTab } from '@/components/admin/LockerManagementTab';
import { StatisticsTab } from '@/components/admin/StatisticsTab';

const AdminPanel = () => {
  const navigate = useNavigate();
  
  const { data: queues, isLoading: queuesLoading, refetch: refetchQueues } = useQueues();
  const { data: lockers, isLoading: lockersLoading } = useLockers();
  const { data: dailyStats } = useDailyStats();
  const updateQueueMutation = useUpdateQueueStatus();

  const handleCallQueue = async (queueId: string) => {
    try {
      await updateQueueMutation.mutateAsync({
        queueId,
        status: 'called'
      });
      toast.success('เรียกคิวสำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleStartService = async (queueId: string) => {
    try {
      await updateQueueMutation.mutateAsync({
        queueId,
        status: 'processing'
      });
      
      toast.success('เริ่มบริการสำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleCompleteService = async (queueId: string) => {
    try {
      await updateQueueMutation.mutateAsync({
        queueId,
        status: 'completed'
      });
      
      toast.success('บริการเสร็จสิ้น');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleApprovePayment = async (queueId: string) => {
    try {
      // Update payment status
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: 'admin'
        })
        .eq('queue_id', queueId);
        
      if (paymentError) throw paymentError;
      
      // Auto-start service after payment approval
      await updateQueueMutation.mutateAsync({
        queueId,
        status: 'processing'
      });
      
      await refetchQueues();
      toast.success('อนุมัติการชำระเงินและเริ่มบริการสำเร็จ');
    } catch (error) {
      console.error('Payment approval error:', error);
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const activeQueues = queues?.filter(q => 
    ['waiting', 'called', 'processing'].includes(q.status)
  ) || [];

  const pendingPaymentQueues = queues?.filter(q => 
    q.payment && q.payment.some((p: any) => p.status === 'pending')
  ) || [];

  if (queuesLoading || lockersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          <Button onClick={() => refetchQueues()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            รีเฟรช
          </Button>
        </div>

        <Tabs defaultValue="queues" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="queues">จัดการคิว</TabsTrigger>
            <TabsTrigger value="payments">การชำระเงิน</TabsTrigger>
            <TabsTrigger value="lockers">ตู้ล็อกเกอร์</TabsTrigger>
            <TabsTrigger value="stats">สถิติ</TabsTrigger>
          </TabsList>

          <TabsContent value="queues">
            <QueueManagementTab
              activeQueues={activeQueues}
              onCallQueue={handleCallQueue}
              onStartService={handleStartService}
              onCompleteService={handleCompleteService}
              isLoading={updateQueueMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentManagementTab
              pendingPaymentQueues={pendingPaymentQueues}
              onApprovePayment={handleApprovePayment}
              isLoading={updateQueueMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="lockers">
            <LockerManagementTab lockers={lockers || []} />
          </TabsContent>

          <TabsContent value="stats">
            <StatisticsTab dailyStats={dailyStats || []} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
