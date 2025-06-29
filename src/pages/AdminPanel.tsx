import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  useQueues, 
  useLockers, 
  useUpdateQueueStatus, 
  useDailyStats, 
  usePendingUsers,
  useApproveUser,
  useRejectUser,
  useAutoAssignLocker
} from '@/hooks/useDatabase';
import { supabase } from '@/integrations/supabase/client';
import { QueueManagementTab } from '@/components/admin/QueueManagementTab';
import { PaymentManagementTab } from '@/components/admin/PaymentManagementTab';
import { LockerManagementTab } from '@/components/admin/LockerManagementTab';
import { StatisticsTab } from '@/components/admin/StatisticsTab';
import { UserApprovalTab } from '@/components/admin/UserApprovalTab';
import { Badge } from '@/components/ui/badge';

const AdminPanel = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'queues';
  
  const { data: queues, isLoading: queuesLoading, refetch: refetchQueues } = useQueues();
  const { data: lockers, isLoading: lockersLoading, refetch: refetchLockers } = useLockers();
  const { data: dailyStats, refetch: refetchStats } = useDailyStats();
  const { data: pendingUsers, isLoading: pendingUsersLoading } = usePendingUsers();
  const updateQueueMutation = useUpdateQueueStatus();
  const approveUserMutation = useApproveUser();
  const rejectUserMutation = useRejectUser();
  const autoAssignLockerMutation = useAutoAssignLocker();

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
      await refetchStats();
      queryClient.invalidateQueries({ queryKey: ['daily_stats'] });
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
      
      await refetchStats();
      queryClient.invalidateQueries({ queryKey: ['daily_stats'] });
      toast.success('เริ่มบริการสำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleCompleteService = async (queueId: string) => {
    try {
      // Get queue info (for locker_number)
      const { data: queue } = await supabase
        .from('queues')
        .select('*')
        .eq('id', queueId)
        .single();

      if (!queue || !queue.locker_number) {
        toast.error('ไม่พบข้อมูลคิวหรือหมายเลขตู้ล็อกเกอร์');
        return;
      }

      // Update queue status to completed and set completed_at
      const { error: queueError } = await supabase
        .from('queues')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', queueId);
      if (queueError) throw queueError;

      // Update locker: set available, released_at, clear user_id/current_queue_id
      const { error: lockerError } = await supabase
        .from('lockers')
        .update({
          status: 'available',
          released_at: new Date().toISOString(),
          user_id: null,
          current_queue_id: null
        })
        .eq('locker_number', queue.locker_number);
      if (lockerError) throw lockerError;

      await refetchQueues();
      await refetchLockers();
      await refetchStats();
      queryClient.invalidateQueries({ queryKey: ['daily_stats'] });
      toast.success('คืนตู้ล็อกเกอร์และจบการใช้บริการสำเร็จ');
    } catch (error) {
      console.error('Complete service error:', error);
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
      if (queue.user?.gender === 'male') {
        gender = 'male';
      } else if (queue.user?.gender === 'female') {
        gender = 'female';
      } else if (queue.user?.restroom_pref === 'male') {
        gender = 'male';
      } else if (queue.user?.restroom_pref === 'female') {
        gender = 'female';
      }

      // Find available locker by gender (ML = male, FL = female)
      const lockerPrefix = gender === 'male' ? 'ML' : gender === 'female' ? 'FL' : null;
      if (!lockerPrefix) {
        toast.error('ไม่สามารถระบุประเภทตู้ล็อกเกอร์ได้');
        return;
      }
      const { data: availableLockers } = await supabase
        .from('lockers')
        .select('*')
        .eq('status', 'available')
        .like('locker_number', `${lockerPrefix}%`)
        .order('locker_number');

      if (!availableLockers || availableLockers.length === 0) {
        // ไม่มี locker ว่าง - เปลี่ยนสถานะ queue กลับเป็น 'called' และแจ้งเตือน
        const { error: queueError } = await supabase
          .from('queues')
          .update({
            status: 'called'
          })
          .eq('id', queueId);

        if (queueError) throw queueError;
        
        await refetchQueues();
        await refetchLockers();
        await refetchStats();
        queryClient.invalidateQueries({ queryKey: ['daily_stats'] });
        toast.error('อนุมัติการชำระเงินแล้ว แต่ไม่มีตู้ล็อกเกอร์ว่าง กรุณารอตู้ล็อกเกอร์ว่างก่อนเริ่มบริการ');
        return;
      }

      const selectedLocker = availableLockers[0];

      // Assign locker to user/queue
      const { error: lockerError } = await supabase
        .from('lockers')
        .update({
          status: 'occupied',
          user_id: queue.user_id,
          current_queue_id: queueId,
          occupied_at: new Date().toISOString(),
          released_at: null
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
      await refetchLockers();
      await refetchStats();
      queryClient.invalidateQueries({ queryKey: ['daily_stats'] });
      toast.success('อนุมัติการชำระเงินและมอบหมายตู้ล็อกเกอร์สำเร็จ');
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

  const handleAutoAssignLocker = async () => {
    try {
      const result = await autoAssignLockerMutation.mutateAsync();
      
      if (result.assigned > 0) {
        toast.success(result.message);
        // แสดงรายละเอียดการมอบหมาย
        result.results.forEach((item: any) => {
          toast.success(`คิว ${item.queueNumber} (${item.userName}) → ตู้ ${item.lockerNumber}`);
        });
      } else {
        toast.info(result.message);
      }
    } catch (error) {
      console.error('Auto assign locker error:', error);
      toast.error('เกิดข้อผิดพลาดในการมอบหมาย locker อัตโนมัติ');
    }
  };

  const activeQueues = queues?.filter(q => 
    ['waiting', 'called', 'payment_pending', 'processing'].includes(q.status)
  ) || [];

  const pendingPaymentQueues = queues?.filter(q => 
    q.payment && q.payment.some((p: any) => p.status === 'pending')
  ) || [];

  const queueCount = activeQueues.length;
  const paymentCount = pendingPaymentQueues.length;
  const pendingUserCount = pendingUsers?.length || 0;

  if (queuesLoading || lockersLoading || pendingUsersLoading) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BFA14A]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF] p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="border-none bg-transparent"
            >
              <span className="inline-flex items-center justify-center rounded-full p-1 hover:bg-[#F3EAD6]">
                <ArrowLeft className="h-5 w-5 text-[#BFA14A]" />
              </span>
            </button>
            <div className="flex flex-col items-center">
              <div className="text-2xl mb-1" style={{ color: '#BFA14A' }}>🚿</div>
              <span className="text-lg font-bold" style={{ color: '#BFA14A' }}>SHOWER STATION</span>
            </div>
            <h1 className="text-2xl font-bold text-[#BFA14A] ml-4">Admin Panel</h1>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleAutoAssignLocker}
              disabled={autoAssignLockerMutation.isPending}
              className="border border-green-600 text-green-600 rounded-md px-3 py-1 font-semibold hover:bg-green-600 hover:text-white transition disabled:opacity-50"
            >
              {autoAssignLockerMutation.isPending ? 'กำลังมอบหมาย...' : 'Auto Assign Locker'}
            </button>
            <button
              onClick={() => refetchQueues()}
              className="border border-[#BFA14A] text-[#BFA14A] rounded-md px-3 py-1 font-semibold hover:bg-[#BFA14A] hover:text-white transition"
            >
              <RefreshCw className="h-4 w-4 mr-2 inline-block" />
              รีเฟรช
            </button>
          </div>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 rounded-xl bg-[#F3EAD6]">
            <TabsTrigger value="queues" className="text-[#BFA14A] flex items-center gap-1">
              จัดการคิว
              {queueCount > 0 && <Badge variant="secondary">{queueCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-[#BFA14A] flex items-center gap-1">
              การชำระเงิน
              {paymentCount > 0 && <Badge variant="secondary">{paymentCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="users" className="text-[#BFA14A] flex items-center gap-1">
              อนุมัติสมาชิก
              {pendingUserCount > 0 && <Badge variant="secondary">{pendingUserCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="lockers" className="text-[#BFA14A]">ตู้ล็อกเกอร์</TabsTrigger>
            <TabsTrigger value="stats" className="text-[#BFA14A]">สถิติ</TabsTrigger>
          </TabsList>

          <TabsContent value="queues">
            <QueueManagementTab
              activeQueues={activeQueues}
              lockers={enhancedLockers}
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
