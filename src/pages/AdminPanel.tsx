import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { 
  useQueues, 
  useLockers, 
  useUpdateQueueStatus, 
  useDailyStats, 
  usePendingUsers,
  useApproveUser,
  useRejectUser
} from '@/hooks/useDatabase';
import { supabase } from '@/integrations/supabase/client';
import { QueueManagementTab } from '@/components/admin/QueueManagementTab';
import { PaymentManagementTab } from '@/components/admin/PaymentManagementTab';
import { LockerManagementTab } from '@/components/admin/LockerManagementTab';
import { StatisticsTab } from '@/components/admin/StatisticsTab';
import { UserApprovalTab } from '@/components/admin/UserApprovalTab';

const AdminPanel = () => {
  const navigate = useNavigate();
  
  const { data: queues, isLoading: queuesLoading, refetch: refetchQueues } = useQueues();
  const { data: lockers, isLoading: lockersLoading } = useLockers();
  const { data: dailyStats } = useDailyStats();
  const { data: pendingUsers, isLoading: pendingUsersLoading } = usePendingUsers();
  const updateQueueMutation = useUpdateQueueStatus();
  const approveUserMutation = useApproveUser();
  const rejectUserMutation = useRejectUser();

  // Get lockers with user and queue data
  const enhancedLockers = lockers?.map(locker => {
    const relatedQueue = queues?.find(q => q.id === locker.current_queue_id);
    const relatedUser = relatedQueue?.user;
    
    return {
      ...locker,
      user: relatedUser,
      queue: relatedQueue
    };
  }) || [];

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
      
      // Get queue and user info for locker assignment
      const { data: queue } = await supabase
        .from('queues')
        .select(`
          *,
          user:users(*)
        `)
        .eq('id', queueId)
        .single();

      if (!queue) throw new Error('Queue not found');

      // Determine gender for locker assignment
      let gender = 'unisex';
      if (queue.user?.gender) {
        gender = queue.user.gender;
      } else if (queue.service_type === 'toilet') {
        gender = queue.user?.restroom_pref || 'unisex';
      }

      // Generate locker number based on gender
      const genderPrefix = gender === 'male' ? 'M' : gender === 'female' ? 'W' : 'U';
      const servicePrefix = queue.service_type === 'shower' ? 'S' : 'T';
      
      // Find available locker with gender prefix
      const { data: availableLockers } = await supabase
        .from('lockers')
        .select('*')
        .eq('status', 'available')
        .like('locker_number', `${genderPrefix}${servicePrefix}%`)
        .order('locker_number');

      if (!availableLockers || availableLockers.length === 0) {
        toast.error('ไม่มีตู้ล็อกเกอร์ว่างสำหรับบริการนี้');
        return;
      }

      const selectedLocker = availableLockers[0];

      // Assign locker to queue
      const { error: lockerError } = await supabase
        .from('lockers')
        .update({
          status: 'occupied',
          user_id: queue.user_id,
          queue_id: queueId,
          occupied_at: new Date().toISOString()
        })
        .eq('id', selectedLocker.id);

      if (lockerError) throw lockerError;

      // Update queue with locker number
      const { error: queueError } = await supabase
        .from('queues')
        .update({
          locker_number: selectedLocker.locker_number,
          status: 'processing'
        })
        .eq('id', queueId);

      if (queueError) throw queueError;
      
      await refetchQueues();
      toast.success(`อนุมัติการชำระเงินและมอบหมายตู้ล็อกเกอร์ ${selectedLocker.locker_number} สำเร็จ`);
    } catch (error) {
      console.error('Payment approval error:', error);
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      await approveUserMutation.mutateAsync(userId);
      toast.success('อนุมัติสมาชิกสำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      await rejectUserMutation.mutateAsync(userId);
      toast.success('ปฏิเสธสมาชิกสำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const activeQueues = queues?.filter(q => 
    ['waiting', 'called', 'processing'].includes(q.status)
  ) || [];

  const pendingPaymentQueues = queues?.filter(q => 
    q.payment && q.payment.some((p: any) => p.status === 'pending')
  ) || [];

  if (queuesLoading || lockersLoading || pendingUsersLoading) {
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="queues">จัดการคิว</TabsTrigger>
            <TabsTrigger value="payments">การชำระเงิน</TabsTrigger>
            <TabsTrigger value="users">อนุมัติสมาชิก</TabsTrigger>
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

          <TabsContent value="users">
            <UserApprovalTab
              pendingUsers={pendingUsers || []}
              onApproveUser={handleApproveUser}
              onRejectUser={handleRejectUser}
              isLoading={approveUserMutation.isPending || rejectUserMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="lockers">
            <LockerManagementTab lockers={enhancedLockers} />
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
