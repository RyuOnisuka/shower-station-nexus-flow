
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Droplets, Users, Shield, Clock } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🚿</div>
          <h1 className="text-4xl font-bold text-blue-600 mb-4">
            Shower Station
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            ระบบจองและจัดการคิวห้องอาบน้ำออนไลน์ ผ่าน LINE OA 
            สะดวก รวดเร็ว และปลอดภัย
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Droplets className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">ห้องอาบน้ำสะอาด</h3>
              <p className="text-sm text-gray-600">
                ห้องอาบน้ำมาตรฐาน พร้อมอุปกรณ์ครบครัน
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">จองคิวง่าย</h3>
              <p className="text-sm text-gray-600">
                จองผ่าน LINE OA ไม่ต้องรอคิวยาวนาน
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">ปลอดภัย</h3>
              <p className="text-sm text-gray-600">
                ระบบรักษาความปลอดภัยข้อมูลส่วนบุคคล
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">เปิด 24 ชั่วโมง</h3>
              <p className="text-sm text-gray-600">
                บริการตลอด 24 ชั่วโมง ทุกวัน
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Buttons */}
        <div className="text-center space-y-4">
          <div className="space-x-4">
            <Button 
              size="lg" 
              onClick={() => navigate('/login')}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 text-lg"
            >
              เริ่มใช้บริการ
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/admin')}
              className="px-8 py-3 text-lg"
            >
              เข้าสู่ระบบแอดมิน
            </Button>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg inline-block">
            <p className="text-sm text-blue-700">
              💡 <strong>Demo Mode:</strong> ในการใช้งานจริง ระบบจะเชื่อมต่อกับ LINE OA และ Supabase
            </p>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-16 grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">วิธีการใช้งาน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                <p className="text-sm">เพิ่มเพื่อน LINE OA: @showerstation</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                <p className="text-sm">กด Rich Menu "สมัคร/เข้าใช้บริการ"</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                <p className="text-sm">รอเรียกคิวและชำระเงินที่เคาน์เตอร์</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
                <p className="text-sm">อัปโหลดสลิปและรับตู้ล็อกเกอร์</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">ข้อมูลการติดต่อ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold">📍 ที่ตั้ง</p>
                <p className="text-sm text-gray-600">123 ถนนสีลม เขตบางรัก กรุงเทพฯ 10500</p>
              </div>
              <div>
                <p className="font-semibold">📞 โทรศัพท์</p>
                <p className="text-sm text-gray-600">02-123-4567</p>
              </div>
              <div>
                <p className="font-semibold">⏰ เวลาทำการ</p>
                <p className="text-sm text-gray-600">เปิดบริการ 24 ชั่วโมง</p>
              </div>
              <div>
                <p className="font-semibold">💰 ราคา</p>
                <p className="text-sm text-gray-600">฿50 ต่อครั้ง (สูงสุด 1 ชั่วโมง)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
