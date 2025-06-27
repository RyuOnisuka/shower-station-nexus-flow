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
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold">สถานะการชำระเงิน</h1>
          </div>
          
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-lg text-yellow-700 flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>รอการตรวจสอบ</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>หมายเลขคิว:</span>
                  <Badge variant="outline" className="text-lg font-bold">
                    {pendingPaymentQueue.queue_number}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>จำนวนเงิน:</span>
                  <span className="font-semibold text-lg">฿{pendingPaymentQueue.price}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>สถานะ:</span>
                  <Badge className="bg-yellow-500 hover:bg-yellow-600">
                    รอเจ้าหน้าที่ตรวจสอบ
                  </Badge>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                <p className="text-sm text-yellow-800">
                  📄 สลิปการโอนเงินของคุณอยู่ในระหว่างการตรวจสอบ
                  <br />
                  ⏰ โดยทั่วไปใช้เวลา 2-3 นาที
                  <br />
                  ✅ หลังได้รับการอนุมัติจะได้รับหมายเลขตู้ล็อกเกอร์
                </p>
              </div>

              <Button 
                onClick={() => navigate('/dashboard')}
                className="w-full mt-4"
                variant="outline"
              >
                กลับหน้าหลัก
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!activeQueue) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold">แจ้งโอน/อัปโหลดสลิป</h1>
          </div>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-lg font-semibold mb-2">ไม่พบคิวที่ต้องชำระเงิน</h2>
              <p className="text-gray-600 mb-4">
                กรุณาสร้างคิวใหม่หรือรอให้เจ้าหน้าที่เรียกคิวของคุณ
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                กลับหน้าหลัก
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">แจ้งโอน/อัปโหลดสลิป</h1>
        </div>

        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg text-green-700 flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>คิวของคุณถูกเรียกแล้ว!</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>หมายเลขคิว:</span>
                <Badge variant="outline" className="text-lg font-bold">
                  {activeQueue.queue_number}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>ชื่อ:</span>
                <span>{activeQueue.user?.first_name} {activeQueue.user?.last_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>จำนวนเงิน:</span>
                <span className="font-semibold text-lg">฿{activeQueue.price}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>สถานะ:</span>
                <Badge className="bg-green-500 hover:bg-green-600">
                  รอชำระเงิน
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">วิธีการชำระเงิน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">📱 เป๋าตุง KTB</p>
              <p className="text-xs text-blue-600 mt-1">
                1. สแกน QR Code ที่เคาน์เตอร์<br/>
                2. ชำระเงิน ฿{activeQueue.price}<br/>
                3. เก็บสลิปการโอนเงิน<br/>
                4. กลับมาอัปโหลดสลิปที่นี่
              </p>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-700 font-medium">💰 PromptPay</p>
              <p className="text-xs text-green-600 mt-1">
                เลขบัญชี: 012-345-6789<br/>
                ชื่อบัญชี: Shower Station Co.,Ltd.<br/>
                จำนวนเงิน: ฿{activeQueue.price}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">อัปโหลดสลิปการโอนเงิน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="slip">เลือกไฟล์สลิป (JPG, PNG)</Label>
              <Input
                id="slip"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="mt-1"
              />
              {selectedFile && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ เลือกไฟล์: {selectedFile.name}
                </p>
              )}
            </div>

            <Button 
              onClick={handleUpload}
              className="w-full"
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  กำลังอัปโหลด...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  อัปโหลดสลิป
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              หลังอัปโหลดสำเร็จ รอเจ้าหน้าที่ตรวจสอบ 2-3 นาที
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ข้อมูลการติดต่อ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>เบอร์โทร:</span>
                <span>{activeQueue.user?.phone_number}</span>
              </div>
              <div className="flex justify-between">
                <span>อีเมล:</span>
                <span>{activeQueue.user?.email || 'ไม่ระบุ'}</span>
              </div>
              <div className="flex justify-between">
                <span>เวลาสร้างคิว:</span>
                <span>{new Date(activeQueue.created_at).toLocaleTimeString('th-TH')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadSlip;
