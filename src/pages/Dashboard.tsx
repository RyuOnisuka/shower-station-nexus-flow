
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Clock, User, MapPin, Phone } from 'lucide-react';

const Dashboard = () => {
  const [currentQueue, setCurrentQueue] = useState<any>(null);
  const navigate = useNavigate();

  const handleWalkInService = () => {
    // Simulate queue creation
    const newQueue = {
      queueNumber: 'MW-001',
      status: 'waiting',
      createdAt: new Date(),
      price: 50
    };
    setCurrentQueue(newQueue);
    toast.success('สร้างคิวสำเร็จ! หมายเลขคิวของคุณคือ MW-001');
  };

  const handleUploadSlip = () => {
    navigate('/upload-slip');
  };

  const handleHistory = () => {
    navigate('/history');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <Card>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl text-blue-600">
              🚿 Shower Station
            </CardTitle>
            <p className="text-sm text-gray-600">ยินดีต้อนรับคุณ สมชาย</p>
          </CardHeader>
        </Card>

        {/* Current Queue Status */}
        {currentQueue && (
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
                    {currentQueue.queueNumber}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>สถานะ:</span>
                  <Badge className="bg-yellow-500 hover:bg-yellow-600">
                    {currentQueue.status === 'waiting' ? 'รอเรียกคิว' : currentQueue.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>ราคา:</span>
                  <span className="font-semibold">฿{currentQueue.price}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Menu */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center" onClick={handleWalkInService}>
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
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">📍</div>
              <h3 className="font-semibold text-sm">ที่ตั้งสาขา & ติดต่อเรา</h3>
              <p className="text-xs text-gray-600 mt-1">Location & Contact</p>
            </CardContent>
          </Card>
        </div>

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
