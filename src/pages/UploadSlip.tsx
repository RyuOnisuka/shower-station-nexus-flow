import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle, Clock } from 'lucide-react';
import { useQueues } from '@/hooks/useDatabase';
import { supabase } from '@/integrations/supabase/client';

const UploadSlip = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  
  const { data: queues } = useQueues();
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');

  const activeQueue = queues?.find(q => 
    q.user?.phone_number === userData.phone_number &&
    q.status === 'called' && 
    (!q.payment || q.payment.every((p: any) => p.status !== 'approved'))
  );

  const pendingPaymentQueue = queues?.find(q => 
    q.user?.phone_number === userData.phone_number &&
    q.payment && q.payment.some((p: any) => p.status === 'pending')
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('กรุณาเลือกไฟล์สลิปการโอนเงิน');
      return;
    }

    if (!activeQueue) {
      toast.error('ไม่พบคิวที่ต้องชำระเงิน');
      return;
    }

    setIsUploading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { error } = await supabase
        .from('payments')
        .insert({
          queue_id: activeQueue.id,
          amount: activeQueue.price,
          payment_method: 'transfer',
          slip_url: `slip_${activeQueue.queue_number}_${Date.now()}.jpg`,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('อัปโหลดสลิปสำเร็จ! รอตรวจสอบจากเจ้าหน้าที่');
      navigate('/dashboard');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการอัปโหลด');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Show pending payment status
  if (pendingPaymentQueue) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] p-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center space-x-3 mb-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="border-none bg-transparent"
            >
              <span className="inline-flex items-center justify-center rounded-full p-1 hover:bg-[#F3EAD6]">
                <ArrowLeft className="h-5 w-5 text-[#BFA14A]" />
              </span>
            </button>
            <div className="flex flex-col items-center">
              <div className="text-2xl mb-1" style={{ color: '#BFA14A' }}>🚿</div>
              <span className="text-lg font-bold" style={{ color: '#BFA14A' }}>SHOWER STATION</span>
            </div>
          </div>
          <Card className="border-[#BFA14A] bg-[#F3EAD6] rounded-xl shadow-md">
            <CardHeader>
              <CardTitle className="text-lg text-[#BFA14A] flex items-center space-x-2">
                <Clock className="h-5 w-5" style={{ color: '#BFA14A' }} />
                <span>รอตรวจสอบ</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-gray-700">
                <div className="flex justify-between items-center">
                  <span>หมายเลขคิว:</span>
                  <Badge variant="outline" className="text-lg font-bold border-[#BFA14A] text-[#BFA14A]">{pendingPaymentQueue.queue_number}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>จำนวนเงิน:</span>
                  <span className="font-semibold text-lg text-[#BFA14A]">฿{pendingPaymentQueue.price}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>สถานะ:</span>
                  <Badge className="bg-[#BFA14A] text-white">รอตรวจสอบ</Badge>
                </div>
              </div>
              <div className="mt-4 p-3 bg-[#FAF6EF] rounded-lg">
                <p className="text-sm text-[#BFA14A]">
                  🧾 สลิปการโอนของคุณอยู่ระหว่างการตรวจสอบ<br />⏰ โดยทั่วไปใช้เวลา 2-3 นาที<br />✅ หลังได้รับอนุมัติจะได้รับหมายเลขตู้ล็อกเกอร์
                </p>
              </div>
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full mt-4 border border-[#BFA14A] text-[#BFA14A] rounded-md font-semibold py-2 hover:bg-[#BFA14A] hover:text-white transition"
              >
                กลับหน้าหลัก
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!activeQueue) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] p-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center space-x-3 mb-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="border-none bg-transparent"
            >
              <span className="inline-flex items-center justify-center rounded-full p-1 hover:bg-[#F3EAD6]">
                <ArrowLeft className="h-5 w-5 text-[#BFA14A]" />
              </span>
            </button>
            <div className="flex flex-col items-center">
              <div className="text-2xl mb-1" style={{ color: '#BFA14A' }}>🚿</div>
              <span className="text-lg font-bold" style={{ color: '#BFA14A' }}>SHOWER STATION</span>
            </div>
          </div>
          <Card className="rounded-xl shadow-md">
            <CardContent className="p-6 text-center">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-lg font-semibold mb-2 text-[#BFA14A]">ไม่พบคิวที่ต้องชำระเงิน</h2>
              <p className="text-gray-700 mb-4">กรุณาสร้างคิวใหม่หรือรอให้เรียกคิวของคุณ</p>
              <button onClick={() => navigate('/dashboard')} className="w-full border border-[#BFA14A] text-[#BFA14A] rounded-md font-semibold py-2 hover:bg-[#BFA14A] hover:text-white transition">
                กลับหน้าหลัก
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF] p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center space-x-3 mb-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="border-none bg-transparent"
          >
            <span className="inline-flex items-center justify-center rounded-full p-1 hover:bg-[#F3EAD6]">
              <ArrowLeft className="h-5 w-5 text-[#BFA14A]" />
            </span>
          </button>
          <div className="flex flex-col items-center">
            <div className="text-2xl mb-1" style={{ color: '#BFA14A' }}>🚿</div>
            <span className="text-lg font-bold" style={{ color: '#BFA14A' }}>SHOWER STATION</span>
          </div>
        </div>
        <Card className="border-[#BFA14A] bg-[#F3EAD6] rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="text-lg text-[#BFA14A] flex items-center space-x-2">
              <Upload className="h-5 w-5" style={{ color: '#BFA14A' }} />
              <span>อัปโหลดสลิป</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-gray-700">
              <div className="flex justify-between items-center">
                <span>หมายเลขคิว:</span>
                <Badge variant="outline" className="text-lg font-bold border-[#BFA14A] text-[#BFA14A]">{activeQueue.queue_number}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>จำนวนเงิน:</span>
                <span className="font-semibold text-lg text-[#BFA14A]">฿{activeQueue.price}</span>
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="slip" className="text-gray-700">เลือกไฟล์สลิป</Label>
              <Input
                id="slip"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="rounded-md border-[#BFA14A] focus:border-[#BFA14A] focus:ring-[#BFA14A] bg-[#FAF6EF] text-gray-800 mt-2"
              />
            </div>
            <button
              onClick={handleUpload}
              className="w-full mt-4 border border-[#BFA14A] text-[#BFA14A] rounded-md font-semibold py-2 hover:bg-[#BFA14A] hover:text-white transition"
              disabled={isUploading}
            >
              {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดสลิป'}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadSlip;

