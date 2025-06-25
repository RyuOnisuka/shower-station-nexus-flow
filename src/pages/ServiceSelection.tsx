
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';
import { useCreateQueue } from '@/hooks/useDatabase';

const ServiceSelection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const createQueue = useCreateQueue();

  // Mock user data - in real app this would come from authentication
  const mockUser = {
    phone_number: '0812345678',
    first_name: 'สมชาย',
    last_name: 'ใจดี',
    gender: 'male',
    restroom_pref: 'male'
  };

  const handleServiceSelection = async (serviceType: 'walk-in' | 'booking') => {
    setIsLoading(true);
    
    try {
      // Generate queue number based on gender and service type
      const genderCode = mockUser.gender === 'male' ? 'M' : 'F';
      const serviceCode = serviceType === 'walk-in' ? 'W' : 'B';
      
      await createQueue.mutateAsync({
        ...mockUser,
        service_type: serviceType
      });

      toast.success(`สร้างคิวสำเร็จ! ประเภท: ${serviceType === 'walk-in' ? 'Walk-in' : 'Booking'}`);
      navigate('/dashboard');
      
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการสร้างคิว');
      console.error('Queue creation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/login')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold text-blue-600">
              🚿 Shower Station
            </h1>
            <p className="text-gray-600">เลือกประเภทการเข้าใช้งาน</p>
          </div>
        </div>

        {/* User Info */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-medium">สวัสดี คุณ{mockUser.first_name}</h3>
              <p className="text-sm text-gray-600">กรุณาเลือกประเภทการเข้าใช้งาน</p>
            </div>
          </CardContent>
        </Card>

        {/* Service Options */}
        <div className="space-y-4">
          {/* Walk-in Option */}
          <Card className="border-2 border-transparent hover:border-blue-300 transition-colors cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                Walk-in
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                เข้าใช้งานทันที - เหมาะสำหรับผู้ที่มาใช้บริการโดยไม่ได้จองล่วงหน้า
              </p>
              <ul className="text-xs text-gray-500 mb-4 space-y-1">
                <li>• รอคิวตามลำดับ</li>
                <li>• ใช้เวลาประมาณ 15-30 นาที</li>
                <li>• ราคา 50 บาท</li>
              </ul>
              <Button
                onClick={() => handleServiceSelection('walk-in')}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'กำลังสร้างคิว...' : 'เลือก Walk-in'}
              </Button>
            </CardContent>
          </Card>

          {/* Booking Option */}
          <Card className="border-2 border-transparent hover:border-green-300 transition-colors cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Calendar className="h-5 w-5 mr-2 text-green-600" />
                Booking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                จองล่วงหน้า - เหมาะสำหรับผู้ที่ต้องการกำหนดเวลาการใช้งาน
              </p>
              <ul className="text-xs text-gray-500 mb-4 space-y-1">
                <li>• จองช่วงเวลาที่ต้องการ</li>
                <li>• รับประกันได้ใช้ตามเวลาที่จอง</li>
                <li>• ราคา 50 บาท</li>
              </ul>
              <Button
                onClick={() => handleServiceSelection('booking')}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isLoading ? 'กำลังสร้างคิว...' : 'เลือก Booking'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-amber-50 rounded-lg">
          <p className="text-sm text-amber-700 text-center">
            💡 หลังจากเลือกประเภทการใช้งานแล้ว ระบบจะสร้างหมายเลขคิวให้อัตโนมัติ
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServiceSelection;
