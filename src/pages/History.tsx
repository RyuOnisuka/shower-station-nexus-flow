
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';
import { useQueues, useDailyStats } from '@/hooks/useDatabase';

const History = () => {
  const navigate = useNavigate();
  const { data: queues, isLoading: queuesLoading } = useQueues();
  const { data: dailyStats, isLoading: statsLoading } = useDailyStats();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      case 'processing': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'เสร็จสิ้น';
      case 'cancelled': return 'ยกเลิก';
      case 'processing': return 'ใช้งาน';
      case 'waiting': return 'รอคิว';
      case 'called': return 'เรียกแล้ว';
      default: return status;
    }
  };

  // คำนวณสถิติรวม
  const totalQueues = queues?.length || 0;
  const completedQueues = queues?.filter(q => q.status === 'completed').length || 0;
  const totalRevenue = queues?.filter(q => q.status === 'completed')
    .reduce((sum, q) => sum + Number(q.price), 0) || 0;

  if (queuesLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">ประวัติและรายงาน</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">คิวทั้งหมด</p>
                  <p className="text-2xl font-bold">{totalQueues}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">บริการสำเร็จ</p>
                  <p className="text-2xl font-bold text-green-600">{completedQueues}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">รายได้รวม</p>
                  <p className="text-2xl font-bold text-purple-600">฿{totalRevenue}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">อัตราสำเร็จ</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {totalQueues > 0 ? Math.round((completedQueues / totalQueues) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transactions">ประวัติการใช้บริการ</TabsTrigger>
            <TabsTrigger value="daily">รายงานรายวัน</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>ประวัติการใช้บริการล่าสุด</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {queues?.slice(0, 20).map((queue) => (
                    <div key={queue.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(queue.status)}>
                            {getStatusText(queue.status)}
                          </Badge>
                          <span className="font-bold">{queue.queue_number}</span>
                          <span>{queue.user?.first_name} {queue.user?.last_name}</span>
                          <span className="text-sm text-gray-600">
                            {queue.user?.phone_number}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                          <span>สร้าง: {new Date(queue.created_at).toLocaleString('th-TH')}</span>
                          {queue.called_at && (
                            <span>เรียก: {new Date(queue.called_at).toLocaleTimeString('th-TH')}</span>
                          )}
                          {queue.started_at && (
                            <span>เริ่ม: {new Date(queue.started_at).toLocaleTimeString('th-TH')}</span>
                          )}
                          {queue.completed_at && (
                            <span>เสร็จ: {new Date(queue.completed_at).toLocaleTimeString('th-TH')}</span>
                          )}
                        </div>
                        
                        {queue.locker_number && (
                          <div className="mt-2">
                            <Badge variant="outline">ตู้ล็อกเกอร์: {queue.locker_number}</Badge>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-lg">฿{queue.price}</div>
                        <div className="text-sm text-gray-600">{queue.service_type}</div>
                      </div>
                    </div>
                  ))}
                  
                  {(!queues || queues.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      ยังไม่มีประวัติการใช้บริการ
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="daily" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>รายงานสถิติรายวัน</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dailyStats?.map((stat) => (
                    <div key={stat.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-lg">
                          {new Date(stat.date).toLocaleDateString('th-TH', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                        <Badge variant="outline" className="text-lg">
                          รายได้: ฿{stat.total_revenue}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="p-3 bg-blue-50 rounded">
                          <div className="text-2xl font-bold text-blue-600">
                            {stat.total_queues}
                          </div>
                          <div className="text-sm text-gray-600">คิวทั้งหมด</div>
                        </div>
                        
                        <div className="p-3 bg-green-50 rounded">
                          <div className="text-2xl font-bold text-green-600">
                            {stat.completed_queues}
                          </div>
                          <div className="text-sm text-gray-600">เสร็จสิ้น</div>
                        </div>
                        
                        <div className="p-3 bg-red-50 rounded">
                          <div className="text-2xl font-bold text-red-600">
                            {stat.cancelled_queues}
                          </div>
                          <div className="text-sm text-gray-600">ยกเลิก</div>
                        </div>
                        
                        <div className="p-3 bg-orange-50 rounded">
                          <div className="text-2xl font-bold text-orange-600">
                            {stat.peak_hour || '-'}:00
                          </div>
                          <div className="text-sm text-gray-600">ช่วงเร็วที่สุด</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-center">
                        <div className="text-lg">
                          อัตราสำเร็จ: <span className="font-bold text-green-600">
                            {stat.total_queues > 0 
                              ? Math.round((stat.completed_queues / stat.total_queues) * 100)
                              : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {(!dailyStats || dailyStats.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      ยังไม่มีข้อมูลสถิติ
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default History;
