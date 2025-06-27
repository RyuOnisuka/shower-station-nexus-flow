import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, CreditCard, History, Droplets, Toilet } from 'lucide-react';
import { useQueues } from '@/hooks/useDatabase';
import { getQueueDisplayName } from '@/utils/queueUtils';

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: queues, refetch } = useQueues();
  const [currentQueue, setCurrentQueue] = useState(null);
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');

  useEffect(() => {
    // Check for newly created queue from localStorage
    const newQueue = localStorage.getItem('currentQueue');
    if (newQueue) {
      setCurrentQueue(JSON.parse(newQueue));
      localStorage.removeItem('currentQueue');
    } else {
      // Find user's active queue
      const userQueue = queues?.find(q => 
        q.user?.phone_number === userData.phone_number && 
        ['waiting', 'called', 'processing'].includes(q.status)
      );
      setCurrentQueue(userQueue || null);
    }
  }, [queues, userData.phone_number]);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'รอเรียกคิว';
      case 'called': return 'เรียกคิวแล้ว - รอชำระเงิน';
      case 'processing': return 'กำลังใช้บริการ';
      case 'completed': return 'ใช้บริการเสร็จสิ้น';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-500';
      case 'called': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'shower': return <Droplets className="h-5 w-5 text-blue-600" />;
      case 'toilet': return <Toilet className="h-5 w-5 text-green-600" />;
      default: return <Droplets className="h-5 w-5 text-blue-600" />;
    }
  };

  const getServiceText = (serviceType: string) => {
    switch (serviceType) {
      case 'shower': return 'อาบน้ำ';
      case 'toilet': return 'ห้องน้ำ';
      default: return 'อาบน้ำ';
    }
  };

  const handlePayment = () => {
    if (currentQueue?.status === 'called') {
      navigate('/upload-slip');
    } else {
      toast.error('คิวยังไม่ถูกเรียก');
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success('รีเฟรชข้อมูลแล้ว');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/service-selection')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            รีเฟรช
          </Button>
        </div>

        {/* Welcome Card */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold text-gray-800">
              สวัสดี คุณ{userData.first_name} {userData.last_name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              ประเภทสมาชิก: {
                userData.user_type === 'employee' ? 'พนักงาน' : 
                userData.user_type === 'dependent' ? 'ผู้ติดตาม' : 'ทั่วไป'
              }
            </p>
          </CardContent>
        </Card>

        {/* Current Queue Card */}
        {currentQueue ? (
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-gray-800">คิวปัจจุบัน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {currentQueue.queue_number}
                </div>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  {getServiceIcon(currentQueue.service_type)}
                  <span className="text-sm text-gray-600">
                    {getQueueDisplayName(currentQueue.queue_number)}
                  </span>
                </div>
                <Badge className={`${getStatusColor(currentQueue.status)} hover:${getStatusColor(currentQueue.status)}`}>
                  {getStatusText(currentQueue.status)}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">ประเภทบริการ:</span>
                  <div className="flex items-center space-x-1">
                    {getServiceIcon(currentQueue.service_type)}
                    <span className="font-medium">
                      {getServiceText(currentQueue.service_type)}
                    </span>
                  </div>
                </div>

                {currentQueue.booking_time && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">เวลาจอง:</span>
                    <span className="font-medium">
                      {new Date(currentQueue.booking_time).toLocaleTimeString('th-TH', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })} น.
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">ราคา:</span>
                  <span className="font-medium text-lg">฿{currentQueue.price}</span>
                </div>

                {currentQueue.locker_number && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">ตู้ล็อกเกอร์:</span>
                    <Badge variant="outline" className="font-bold">
                      {currentQueue.locker_number}
                    </Badge>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">เวลาสร้างคิว:</span>
                  <span className="text-sm">
                    {new Date(currentQueue.created_at).toLocaleString('th-TH')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4">
                {currentQueue.status === 'called' && (
                  <Button 
                    onClick={handlePayment}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    ชำระเงิน/อัปโหลดสลิป
                  </Button>
                )}

                {currentQueue.status === 'processing' && currentQueue.locker_number && (
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <MapPin className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-blue-700 font-medium">
                      กรุณาไปที่ตู้ล็อกเกอร์หมายเลข {currentQueue.locker_number}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">ไม่มีคิวที่ใช้งาน</h2>
              <p className="text-gray-600 mb-4">คุณไม่มีคิวที่กำลังรอใช้บริการในขณะนี้</p>
              <Button 
                onClick={() => navigate('/service-selection')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                สร้างคิวใหม่
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-gray-800">เมนูหลัก</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => navigate('/service-selection')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              สร้างคิวใหม่
            </Button>
            
            <Button 
              onClick={() => navigate('/history')}
              variant="outline"
              className="w-full"
            >
              <History className="h-4 w-4 mr-2" />
              ประวัติการใช้งาน
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
