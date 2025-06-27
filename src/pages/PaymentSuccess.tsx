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
    <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-xl shadow-md">
        <CardHeader className="text-center pb-2">
          <div className="flex flex-col items-center mb-2">
            <div className="text-5xl mb-1" style={{ color: '#BFA14A' }}>🚿</div>
            <div className="text-2xl font-bold" style={{ color: '#BFA14A', letterSpacing: 1 }}>SHOWER STATION</div>
          </div>
          <div className="mx-auto w-16 h-16 bg-[#F3EAD6] rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-[#BFA14A]" />
          </div>
          <CardTitle className="text-2xl text-[#BFA14A]">
            ชำระเงินสำเร็จ!
          </CardTitle>
          <p className="text-gray-700">เรียบร้อยแล้ว พร้อมใช้งานบริการ</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Queue Info */}
          <div className="bg-[#FAF6EF] p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">หมายเลขคิว:</span>
              <Badge variant="outline" className="text-lg font-bold border-[#BFA14A] text-[#BFA14A]">
                {successData.queueNumber}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">จำนวนเงิน:</span>
              <span className="font-semibold text-[#BFA14A]">฿{successData.amount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">เวลาอนุมัติ:</span>
              <span className="text-sm">{successData.approvedAt}</span>
            </div>
          </div>
          {/* Locker Info */}
          <Card className="border-2 border-[#BFA14A] bg-[#F3EAD6] rounded-xl">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Key className="h-5 w-5 text-[#BFA14A]" />
                <span className="font-semibold text-[#BFA14A]">ตู้ล็อกเกอร์ของคุณ</span>
              </div>
              <div className="text-3xl font-bold text-[#BFA14A] mb-2">
                #{successData.lockerNumber}
              </div>
              <p className="text-sm text-[#BFA14A]">กรุณาจำหมายเลขตู้ล็อกเกอร์นี้ไว้</p>
            </CardContent>
          </Card>
          {/* Instructions */}
          <div className="bg-[#F3EAD6] p-4 rounded-lg">
            <h4 className="font-semibold text-[#BFA14A] mb-2 flex items-center">
              <Clock className="h-4 w-4 mr-2" style={{ color: '#BFA14A' }} />
              คำแนะนำการใช้งาน
            </h4>
            <ul className="text-sm text-[#BFA14A] space-y-1">
              <li>• เข้าใช้งานห้องอาบน้ำได้ทันที</li>
              <li>• เก็บของส่วนตัวในตู้ล็อกเกอร์ #{successData.lockerNumber}</li>
              <li>• เวลาใช้งาน: สูงสุด 1 ชั่วโมง</li>
              <li>• หากมีข้อสงสัย ติดต่อเจ้าหน้าที่</li>
            </ul>
          </div>
          {/* Action Buttons */}
          <div className="space-y-3">
            <button 
              className="w-full border border-[#BFA14A] text-[#BFA14A] rounded-md font-semibold py-2 hover:bg-[#BFA14A] hover:text-white transition" 
              onClick={() => navigate('/dashboard')}
            >
              <Home className="mr-2 h-4 w-4 inline-block" />
              กลับหน้าหลัก
            </button>
            <button 
              className="w-full border border-[#BFA14A] text-[#BFA14A] rounded-md font-semibold py-2 hover:bg-[#BFA14A] hover:text-white transition"
              onClick={() => navigate('/history')}
            >
              ดูประวัติการใช้งาน
            </button>
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
