
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Clock, User, MapPin, Phone } from 'lucide-react';
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

  const handleUploadSlip = () => {
    navigate('/upload-slip');
  };

  const handleHistory = () => {
    navigate('/history');
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

        {/* Queue Form */}
        {showCreateQueue && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">สมัครเข้าใช้บริการ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="ชื่อ"
                  value={userForm.first_name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, first_name: e.target.value }))}
                  className="px-3 py-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="นามสกุล"
                  value={userForm.last_name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, last_name: e.target.value }))}
                  className="px-3 py-2 border rounded"
                />
              </div>
              <input
                type="tel"
                placeholder="เบอร์โทรศัพท์"
                value={userForm.phone_number}
                onChange={(e) => setUserForm(prev => ({ ...prev, phone_number: e.target.value }))}
                className="w-full px-3 py-2 border rounded"
              />
              <div className="flex space-x-2">
                <Button
                  onClick={handleCreateQueue}
                  disabled={createQueueMutation.isPending}
                  className="flex-1"
                >
                  {createQueueMutation.isPending ? 'กำลังสร้าง...' : 'สร้างคิว'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateQueue(false)}
                  className="flex-1"
                >
                  ยกเลิก
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Menu */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent 
              className="p-4 text-center" 
              onClick={() => setShowCreateQueue(true)}
            >
              <div className="text-3xl mb-2">🚶‍♂️</div>
              <h3 className="font-semibold text-sm">สมัคร / เข้าใช้บริการ</h3>
              <p className="text-xs text-gray-600 mt-1">Walk-in Service</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center" onClick={handleUploadSlip}>
              <div className="text-3xl mb-2">📜</div>
              <h3 className="font-semibold text-sm">แจ้งโอน/อัปโหลดสลิป</h3>
              <p className="text-xs text-gray-600 mt-1">Upload Payment</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center" onClick={handleHistory}>
              <div className="text-3xl mb-2">📋</div>
              <h3 className="font-semibold text-sm">ประวัติการใช้บริการ</h3>
              <p className="text-xs text-gray-600 mt-1">History</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent 
              className="p-4 text-center"
              onClick={() => navigate('/admin')}
            >
              <div className="text-3xl mb-2">⚙️</div>
              <h3 className="font-semibold text-sm">Admin Panel</h3>
              <p className="text-xs text-gray-600 mt-1">จัดการระบบ</p>
            </CardContent>
          </Card>
        </div>

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
              <span className="text-sm">เปิดบริการ 06:00 - 22:00 น.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
