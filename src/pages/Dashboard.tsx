
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Clock, User, MapPin, Phone, Calendar, Upload, History, Settings } from 'lucide-react';
import { useQueues, useCreateQueue } from '@/hooks/useDatabase';

const Dashboard = () => {
  const [showCreateQueue, setShowCreateQueue] = useState(false);
  const [userForm, setUserForm] = useState({
    phone_number: '',
    first_name: '',
    last_name: '',
    gender: 'male',
    restroom_pref: 'male'
  });
  
  const navigate = useNavigate();
  const { data: queues, isLoading } = useQueues();
  const createQueueMutation = useCreateQueue();

  // หาคิวของผู้ใช้ปัจจุบัน (จำลอง)
  const currentUserQueue = queues?.find(q => 
    q.status === 'waiting' || q.status === 'called' || q.status === 'processing'
  );

  const handleCreateQueue = async () => {
    if (!userForm.phone_number || !userForm.first_name || !userForm.last_name) {
      toast.error('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    try {
      await createQueueMutation.mutateAsync(userForm);
      toast.success('สร้างคิวสำเร็จ!');
      setShowCreateQueue(false);
      setUserForm({
        phone_number: '',
        first_name: '',
        last_name: '',
        gender: 'male',
        restroom_pref: 'male'
      });
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการสร้างคิว');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <Card>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl text-blue-600">
              🚿 Shower Station
            </CardTitle>
            <p className="text-sm text-gray-600">ยินดีต้อนรับ</p>
          </CardHeader>
        </Card>

        {/* Current Queue Status */}
        {currentUserQueue && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg text-blue-700">
                คิวปัจจุบัน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>หมายเลขคิว:</span>
                  <Badge variant="outline" className="text-lg font-bold">
                    {currentUserQueue.queue_number}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>สถานะ:</span>
                  <Badge className={
                    currentUserQueue.status === 'waiting' ? 'bg-yellow-500' :
                    currentUserQueue.status === 'called' ? 'bg-green-500' :
                    'bg-blue-500'
                  }>
                    {currentUserQueue.status === 'waiting' ? 'รอเรียกคิว' :
                     currentUserQueue.status === 'called' ? 'เรียกคิวแล้ว' :
                     'กำลังใช้บริการ'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>ราคา:</span>
                  <span className="font-semibold">฿{currentUserQueue.price}</span>
                </div>
                {currentUserQueue.locker_number && (
                  <div className="flex justify-between items-center">
                    <span>ตู้ล็อกเกอร์:</span>
                    <span className="font-semibold">{currentUserQueue.locker_number}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rich Menu - Updated to match LINE OA requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-center">📱 Rich Menu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {/* Left Column */}
              <div className="space-y-3">
                {/* สมัครสมาชิก/เข้าใช้บริการ */}
                <Card className="cursor-pointer hover:shadow-md transition-shadow bg-blue-50 border-blue-200">
                  <CardContent 
                    className="p-3 text-center" 
                    onClick={() => navigate('/service-selection')}
                  >
                    <div className="text-2xl mb-1">👤</div>
                    <h3 className="font-semibold text-xs">สมัครสมาชิก/</h3>
                    <h3 className="font-semibold text-xs">เข้าใช้บริการ</h3>
                  </CardContent>
                </Card>

                {/* แจ้งโอน/อัปโหลดสลิป */}
                <Card className="cursor-pointer hover:shadow-md transition-shadow bg-green-50 border-green-200">
                  <CardContent 
                    className="p-3 text-center" 
                    onClick={() => navigate('/upload-slip')}
                  >
                    <Upload className="h-6 w-6 mx-auto mb-1 text-green-600" />
                    <h3 className="font-semibold text-xs">แจ้งโอน/</h3>
                    <h3 className="font-semibold text-xs">อัปโหลดสลิป</h3>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-3">
                {/* ประวัติการใช้บริการ */}
                <Card className="cursor-pointer hover:shadow-md transition-shadow bg-purple-50 border-purple-200">
                  <CardContent 
                    className="p-3 text-center" 
                    onClick={() => navigate('/history')}
                  >
                    <History className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                    <h3 className="font-semibold text-xs">ประวัติการ</h3>
                    <h3 className="font-semibold text-xs">ใช้บริการ</h3>
                  </CardContent>
                </Card>

                {/* จัดการระบบ (Admin) */}
                <Card className="cursor-pointer hover:shadow-md transition-shadow bg-orange-50 border-orange-200">
                  <CardContent 
                    className="p-3 text-center"
                    onClick={() => navigate('/admin')}
                  >
                    <Settings className="h-6 w-6 mx-auto mb-1 text-orange-600" />
                    <h3 className="font-semibold text-xs">จัดการระบบ</h3>
                    <h3 className="font-semibold text-xs">(Admin)</h3>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queue Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">สถานการณ์คิววันนี้</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {queues?.filter(q => q.status === 'waiting').length || 0}
                </div>
                <div className="text-sm text-gray-600">รอคิว</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {queues?.filter(q => q.status === 'processing').length || 0}
                </div>
                <div className="text-sm text-gray-600">ใช้งาน</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {queues?.filter(q => q.status === 'completed').length || 0}
                </div>
                <div className="text-sm text-gray-600">เสร็จสิ้น</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ข้อมูลติดต่อ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              <span className="text-sm">123 ถนนสีลม เขตบางรัก กรุงเทพฯ</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-blue-500" />
              <span className="text-sm">02-123-4567</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm">เปิดบริการ 07:00 - 21:00 น.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
