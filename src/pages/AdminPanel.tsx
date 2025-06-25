
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useQueues, useLockers, useUpdateQueueStatus, useDailyStats } from '@/hooks/useDatabase';
import { supabase } from '@/integrations/supabase/client';

const AdminPanel = () => {
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
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
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: 'admin'
        })
        .eq('queue_id', queueId);
        
      if (error) throw error;
      
      await refetchQueues();
      toast.success('อนุมัติการชำระเงินสำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-500';
      case 'called': return 'bg-blue-500';
      case 'processing': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'รอคิว';
      case 'called': return 'เรียกแล้ว';
      case 'processing': return 'ใช้งาน';
      case 'completed': return 'เสร็จสิ้น';
      case 'cancelled': return 'ยกเลิก';
      default: return status;
    }
  };

  const activeQueues = queues?.filter(q => 
    ['waiting', 'called', 'processing'].includes(q.status)
  ) || [];
  
  const availableLockers = lockers?.filter(l => l.status === 'available') || [];

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

          <TabsContent value="queues" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>คิวที่ใช้งานอยู่</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeQueues.map((queue) => (
                    <div key={queue.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          เวลา: {new Date(queue.created_at).toLocaleTimeString('th-TH')} | 
                          ราคา: ฿{queue.price}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        {queue.status === 'waiting' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleCallQueue(queue.id)}
                            disabled={updateQueueMutation.isPending}
                          >
                            เรียกคิว
                          </Button>
                        )}
                        
                        {queue.status === 'called' && (
                          <Button 
                            size="sm"
                            onClick={() => handleStartService(queue.id)}
                            disabled={updateQueueMutation.isPending}
                          >
                            เริ่มบริการ
                          </Button>
                        )}
                        
                        {queue.status === 'processing' && (
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => handleCompleteService(queue.id)}
                            disabled={updateQueueMutation.isPending}
                          >
                            บริการเสร็จ
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {activeQueues.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      ไม่มีคิวที่ใช้งานอยู่
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>รอตรวจสอบการชำระเงิน</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {queues?.filter(q => 
                    q.payment && q.payment.some((p: any) => p.status === 'pending')
                  ).map((queue) => (
                    <div key={queue.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="font-bold">{queue.queue_number}</span>
                          <span>{queue.user?.first_name} {queue.user?.last_name}</span>
                          <Badge variant="outline">฿{queue.price}</Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          เวลาส่งสลิป: {new Date(queue.payment[0]?.created_at).toLocaleString('th-TH')}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          size="sm"
                          onClick={() => handleApprovePayment(queue.id)}
                        >
                          อนุมัติ
                        </Button>
                        <Button size="sm" variant="outline">
                          ปฏิเสธ
                        </Button>
                      </div>
                    </div>
                  )) || []}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lockers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>สถานะตู้ล็อกเกอร์</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {lockers?.map((locker) => (
                    <Card key={locker.id} className={`p-4 text-center ${
                      locker.status === 'available' ? 'bg-green-50 border-green-200' :
                      locker.status === 'occupied' ? 'bg-red-50 border-red-200' :
                      'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="font-bold text-lg">{locker.locker_number}</div>
                      <div className="text-sm text-gray-600">{locker.location}</div>
                      <Badge 
                        className={`mt-2 ${
                          locker.status === 'available' ? 'bg-green-500' :
                          locker.status === 'occupied' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`}
                      >
                        {locker.status === 'available' ? 'ว่าง' :
                         locker.status === 'occupied' ? 'ใช้งาน' : 'ซ่อม'}
                      </Badge>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">คิววันนี้</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {dailyStats?.[0]?.total_queues || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">เสร็จสิ้น</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {dailyStats?.[0]?.completed_queues || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">รายได้วันนี้</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    ฿{dailyStats?.[0]?.total_revenue || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">ช่วงเวลาเร็ววันนี้</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {dailyStats?.[0]?.peak_hour || '-'}:00
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>สถิติ 7 วันย้อนหลัง</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dailyStats?.slice(0, 7).map((stat) => (
                    <div key={stat.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex space-x-4">
                        <span className="font-medium">
                          {new Date(stat.date).toLocaleDateString('th-TH')}
                        </span>
                        <span>คิว: {stat.total_queues}</span>
                        <span>เสร็จ: {stat.completed_queues}</span>
                      </div>
                      <div className="font-bold text-green-600">
                        ฿{stat.total_revenue}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
