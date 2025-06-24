
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle } from 'lucide-react';

const UploadSlip = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  // Mock queue data
  const activeQueue = {
    queueNumber: 'MW-001',
    price: 50,
    status: 'called',
    createdAt: new Date()
  };

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

    setIsUploading(true);
    
    try {
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('อัปโหลดสลิปสำเร็จ! รอตรวจสอบจากเจ้าหน้าที่');
      navigate('/payment-success');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการอัปโหลด');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
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

        {/* Queue Info */}
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
                  {activeQueue.queueNumber}
                </Badge>
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

        {/* Payment Instructions */}
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
          </CardContent>
        </Card>

        {/* Upload Form */}
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
      </div>
    </div>
  );
};

export default UploadSlip;
