
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Key, Clock, Home } from 'lucide-react';

const PaymentSuccess = () => {
  const navigate = useNavigate();

  // Mock success data
  const successData = {
    queueNumber: 'MW-001',
    lockerNumber: 'A12',
    amount: 50,
    approvedAt: new Date().toLocaleTimeString('th-TH')
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">
            ชำระเงินสำเร็จ!
          </CardTitle>
          <p className="text-gray-600">เรียบร้อยแล้ว พร้อมใช้บริการ</p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Queue Info */}
          <div className="bg-green-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">หมายเลขคิว:</span>
              <Badge variant="outline" className="text-lg font-bold">
                {successData.queueNumber}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">จำนวนเงิน:</span>
              <span className="font-semibold">฿{successData.amount}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">เวลาอนุมัติ:</span>
              <span className="text-sm">{successData.approvedAt}</span>
            </div>
          </div>

          {/* Locker Info */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Key className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-700">ตู้ล็อกเกอร์ของคุณ</span>
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                #{successData.lockerNumber}
              </div>
              <p className="text-sm text-blue-600">
                กรุณาจำหมายเลขนี้ไว้
              </p>
            </CardContent>
          </Card>

          {/* Instructions */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              คำแนะนำการใช้งาน
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• เข้าใช้ห้องอาบน้ำได้ทันที</li>
              <li>• เก็บของส่วนตัวในตู้ล็อกเกอร์ #{successData.lockerNumber}</li>
              <li>• เวลาใช้งาน: สูงสุด 1 ชั่วโมง</li>
              <li>• หากมีข้อสงสัย ติดต่อเจ้าหน้าที่</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              className="w-full" 
              onClick={() => navigate('/dashboard')}
            >
              <Home className="mr-2 h-4 w-4" />
              กลับหน้าหลัก
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/history')}
            >
              ดูประวัติการใช้บริการ
            </Button>
          </div>

          {/* Contact */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-gray-500">
              หากมีปัญหาการใช้งาน โทร 02-123-4567
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
