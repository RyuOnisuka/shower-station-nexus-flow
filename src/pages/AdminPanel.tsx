import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, LogOut, User, Shield, Settings, FileText, AlertTriangle, Download, Upload } from 'lucide-react';
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
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { createAuditLog } from '@/hooks/useAuditLogs';
import { useMonitoring } from '@/hooks/useMonitoring';
import { useRateLimit } from '@/utils/rateLimiter';
import { useBackup } from '@/utils/backup';
import { supabase } from '@/integrations/supabase/client';
import { QueueManagementTab } from '@/components/admin/QueueManagementTab';
import { PaymentManagementTab } from '@/components/admin/PaymentManagementTab';
import { LockerManagementTab } from '@/components/admin/LockerManagementTab';
import { StatisticsTab } from '@/components/admin/StatisticsTab';
import { UserApprovalTab } from '@/components/admin/UserApprovalTab';
import AdminUserManagementTab from '@/components/admin/AdminUserManagementTab';
import SystemSettingsTab from '@/components/admin/SystemSettingsTab';
import AuditLogsTab from '@/components/admin/AuditLogsTab';
import SecurityDashboardTab from '@/components/admin/SecurityDashboardTab';
import RoleBasedTab from '@/components/admin/RoleBasedTab';
import { Badge } from '@/components/ui/badge';

const AdminPanel = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'queues';
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  
  const { adminUser, logout, hasPermission } = useAdminAuth();
  const { logAction, logError } = useMonitoring();
  const { checkRateLimit } = useRateLimit('adminAction');
  const { createBackup, restoreBackup } = useBackup();
  
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

  const handleCreateBackup = async () => {
    try {
      setIsBackupLoading(true);
      logAction('admin_create_backup', { adminUserId: adminUser?.id });
      
      const backupData = await createBackup();
      
      // Create download link
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shower-station-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('สร้างไฟล์ backup สำเร็จ');
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Failed to create backup'));
      toast.error('เกิดข้อผิดพลาดในการสร้าง backup');
    } finally {
      setIsBackupLoading(false);
    }
  };

  const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsBackupLoading(true);
      logAction('admin_restore_backup', { adminUserId: adminUser?.id });
      
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      await restoreBackup('temp-backup-id', { overwrite: true, validate: true });
      
      // Refresh all data
      await Promise.all([
        refetchQueues(),
        refetchLockers(),
        refetchStats()
      ]);
      
      toast.success('กู้คืนข้อมูลสำเร็จ');
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Failed to restore backup'));
      toast.error('เกิดข้อผิดพลาดในการกู้คืนข้อมูล');
    } finally {
      setIsBackupLoading(false);
      // Clear file input
      event.target.value = '';
    }
  };

  const handleCallQueue = async (queueId: string) => {
    try {
      // Check rate limit
      const rateLimitResult = checkRateLimit(adminUser?.id || 'anonymous');
      if (!rateLimitResult.allowed) {
        toast.error(`กรุณารอ ${rateLimitResult.retryAfter} วินาทีก่อนลองใหม่`);
        return;
      }

      logAction('admin_call_queue', { queueId, adminUserId: adminUser?.id });
      
      await updateQueueMutation.mutateAsync({
        queueId,
        status: 'called'
      });
      await refetchStats();
      queryClient.invalidateQueries({ queryKey: ['daily_stats'] });
      
      // สร้าง audit log
      await createAuditLog({
        action: 'call_queue',
        table_name: 'queues',
        record_id: queueId,
        new_values: { status: 'called' },
        ip_address: '127.0.0.1', // ในระบบจริงควรดึงจาก request
        user_agent: navigator.userAgent
      });
      
      toast.success('เรียกคิวสำเร็จ');
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Failed to call queue'));
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleStartService = async (queueId: string) => {
    try {
      // Check rate limit
      const rateLimitResult = checkRateLimit(adminUser?.id || 'anonymous');
      if (!rateLimitResult.allowed) {
        toast.error(`กรุณารอ ${rateLimitResult.retryAfter} วินาทีก่อนลองใหม่`);
        return;
      }

      logAction('admin_start_service', { queueId, adminUserId: adminUser?.id });
      
      await updateQueueMutation.mutateAsync({
        queueId,
        status: 'processing'
      });
      
      await refetchStats();
      queryClient.invalidateQueries({ queryKey: ['daily_stats'] });
      
      // สร้าง audit log
      await createAuditLog({
        action: 'start_service',
        table_name: 'queues',
        record_id: queueId,
        new_values: { status: 'processing' },
        ip_address: '127.0.0.1',
        user_agent: navigator.userAgent
      });
      
      toast.success('เริ่มบริการสำเร็จ');
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Failed to start service'));
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleCompleteService = async (queueId: string) => {
    try {
      // Check rate limit
      const rateLimitResult = checkRateLimit(adminUser?.id || 'anonymous');
      if (!rateLimitResult.allowed) {
        toast.error(`กรุณารอ ${rateLimitResult.retryAfter} วินาทีก่อนลองใหม่`);
        return;
      }

      logAction('admin_complete_service', { queueId, adminUserId: adminUser?.id });

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
      
      // สร้าง audit log
      await createAuditLog({
        action: 'complete_service',
        table_name: 'queues',
        record_id: queueId,
        new_values: { 
          status: 'completed', 
          completed_at: new Date().toISOString(),
          locker_number: queue.locker_number
        },
        ip_address: '127.0.0.1',
        user_agent: navigator.userAgent
      });
      
      toast.success('คืนตู้ล็อกเกอร์และจบการใช้บริการสำเร็จ');
    } catch (error) {
      console.error('Complete service error:', error);
      logError(error instanceof Error ? error : new Error('Failed to complete service'));
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleApprovePayment = async (queueId: string) => {
    try {
      // Check rate limit
      const rateLimitResult = checkRateLimit(adminUser?.id || 'anonymous');
      if (!rateLimitResult.allowed) {
        toast.error(`กรุณารอ ${rateLimitResult.retryAfter} วินาทีก่อนลองใหม่`);
        return;
      }

      logAction('admin_approve_payment', { queueId, adminUserId: adminUser?.id });

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

      // Auto-assign locker if available
      const { data: availableLocker } = await supabase
        .from('lockers')
        .select('*')
        .eq('status', 'available')
        .eq('gender', queue.user?.gender || 'male')
        .limit(1)
        .single();

      if (availableLocker) {
        // Assign locker to user
        const { error: lockerUpdateError } = await supabase
          .from('lockers')
          .update({
            status: 'occupied',
            user_id: queue.user_id,
            current_queue_id: queueId,
            assigned_at: new Date().toISOString()
          })
          .eq('id', availableLocker.id);

        if (lockerUpdateError) throw lockerUpdateError;

        // Update queue with locker number
        const { error: queueUpdateError } = await supabase
          .from('queues')
          .update({
            locker_number: availableLocker.locker_number
          })
          .eq('id', queueId);

        if (queueUpdateError) throw queueUpdateError;

        toast.success(`อนุมัติการชำระเงินและมอบหมายตู้ล็อกเกอร์ ${availableLocker.locker_number} สำเร็จ`);
      } else {
        toast.success('อนุมัติการชำระเงินสำเร็จ (ไม่มีตู้ล็อกเกอร์ว่าง)');
      }

      await refetchQueues();
      await refetchLockers();
      
    } catch (error) {
      console.error('Approve payment error:', error);
      logError(error instanceof Error ? error : new Error('Failed to approve payment'));
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      // Check rate limit
      const rateLimitResult = checkRateLimit(adminUser?.id || 'anonymous');
      if (!rateLimitResult.allowed) {
        toast.error(`กรุณารอ ${rateLimitResult.retryAfter} วินาทีก่อนลองใหม่`);
        return;
      }

      logAction('admin_approve_user', { userId, adminUserId: adminUser?.id });
      
      await approveUserMutation.mutateAsync(userId);
      toast.success('อนุมัติผู้ใช้สำเร็จ');
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Failed to approve user'));
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      // Check rate limit
      const rateLimitResult = checkRateLimit(adminUser?.id || 'anonymous');
      if (!rateLimitResult.allowed) {
        toast.error(`กรุณารอ ${rateLimitResult.retryAfter} วินาทีก่อนลองใหม่`);
        return;
      }

      logAction('admin_reject_user', { userId, adminUserId: adminUser?.id });
      
      await rejectUserMutation.mutateAsync(userId);
      toast.success('ปฏิเสธผู้ใช้สำเร็จ');
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Failed to reject user'));
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleAutoAssignLocker = async () => {
    try {
      // Check rate limit
      const rateLimitResult = checkRateLimit(adminUser?.id || 'anonymous');
      if (!rateLimitResult.allowed) {
        toast.error(`กรุณารอ ${rateLimitResult.retryAfter} วินาทีก่อนลองใหม่`);
        return;
      }

      logAction('admin_auto_assign_locker', { adminUserId: adminUser?.id });
      
      await autoAssignLockerMutation.mutateAsync();
      await refetchQueues();
      await refetchLockers();
      toast.success('มอบหมายตู้ล็อกเกอร์อัตโนมัติสำเร็จ');
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Failed to auto assign locker'));
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleLogout = async () => {
    try {
      logAction('admin_logout', { adminUserId: adminUser?.id });
      await logout();
      navigate('/admin-login');
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Failed to logout'));
      toast.error('เกิดข้อผิดพลาดในการออกจากระบบ');
    }
  };

  const handleRefresh = async () => {
    try {
      logAction('admin_refresh_data', { adminUserId: adminUser?.id });
      await Promise.all([
        refetchQueues(),
        refetchLockers(),
        refetchStats()
      ]);
      toast.success('อัปเดตข้อมูลสำเร็จ');
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Failed to refresh data'));
      toast.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    }
  };

  if (!adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">กำลังโหลด...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-500">
                  ยินดีต้อนรับ {adminUser.username} ({adminUser.role})
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Backup/Restore buttons for admin users */}
              {hasPermission('admin') && (
                <>
                  <Button
                    onClick={handleCreateBackup}
                    variant="outline"
                    size="sm"
                    disabled={isBackupLoading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Backup
                  </Button>
                  
                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleRestoreBackup}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isBackupLoading}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isBackupLoading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                  </div>
                </>
              )}
              
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={queuesLoading || lockersLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                อัปเดต
              </Button>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={defaultTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="queues" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">คิว</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">การชำระเงิน</span>
            </TabsTrigger>
            <TabsTrigger value="lockers" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">ล็อกเกอร์</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">ผู้ใช้</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">สถิติ</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">ความปลอดภัย</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">ตั้งค่า</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Audit</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queues">
            <QueueManagementTab
              activeQueues={queues?.filter(q => 
                ['waiting', 'called', 'payment_pending', 'processing'].includes(q.status)
              ) || []}
              lockers={enhancedLockers}
              onCallQueue={handleCallQueue}
              onStartService={handleStartService}
              onCompleteService={handleCompleteService}
              isLoading={queuesLoading}
            />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentManagementTab
              pendingPaymentQueues={queues?.filter(q => 
                q.payment && q.payment.some((p: any) => p.status === 'pending')
              ) || []}
              onApprovePayment={handleApprovePayment}
              isLoading={false}
            />
          </TabsContent>

          <TabsContent value="lockers">
            <LockerManagementTab
              lockers={enhancedLockers}
            />
          </TabsContent>

          <TabsContent value="users">
            <UserApprovalTab
              pendingUsers={pendingUsers || []}
              isLoading={pendingUsersLoading}
              onApproveUser={handleApproveUser}
              onRejectUser={handleRejectUser}
            />
          </TabsContent>

          <TabsContent value="stats">
            <StatisticsTab
              dailyStats={dailyStats}
            />
          </TabsContent>

          <TabsContent value="security">
            <SecurityDashboardTab />
          </TabsContent>

          <TabsContent value="settings">
            <SystemSettingsTab />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
