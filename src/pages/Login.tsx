
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Check if user exists in database
      const { data: existingUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .maybeSingle();

      if (error) {
        console.error('Error checking user:', error);
        toast.error('เกิดข้อผิดพลาดในการตรวจสอบข้อมูล');
        return;
      }

      if (existingUser) {
        // User exists, store data and navigate
        localStorage.setItem('userData', JSON.stringify(existingUser));
        toast.success('เข้าสู่ระบบสำเร็จ!');
        navigate('/service-selection');
      } else {
        // User doesn't exist, navigate to register
        toast.error('ไม่พบข้อมูลผู้ใช้ กรุณาลงทะเบียนก่อน');
        navigate('/register');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLineLogin = async () => {
    setIsLoading(true);
    
    try {
      // Simulate LINE login - in real implementation, this would use LINE API
      const mockLineUserId = 'line_user_123';
      
      // Check if LINE user exists
      const { data: existingUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('line_user_id', mockLineUserId)
        .maybeSingle();

      if (error) {
        console.error('Error checking LINE user:', error);
        toast.error('เกิดข้อผิดพลาดในการตรวจสอบข้อมูล LINE');
        return;
      }

      if (existingUser) {
        // User exists, store data and navigate
        localStorage.setItem('userData', JSON.stringify(existingUser));
        toast.success('เข้าสู่ระบบด้วย LINE สำเร็จ!');
        navigate('/service-selection');
      } else {
        // New LINE user, navigate to register with LINE info
        const lineUserData = {
          line_user_id: mockLineUserId,
          first_name: 'สมาชิก',
          last_name: 'ไลน์',
          phone_number: '',
          gender: 'unspecified',
          restroom_pref: 'male',
          user_type: 'general'
        };
        localStorage.setItem('lineUserData', JSON.stringify(lineUserData));
        toast.info('กรุณาลงทะเบียนข้อมูลเพิ่มเติม');
        navigate('/register');
      }
    } catch (error) {
      console.error('LINE login error:', error);
      toast.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย LINE');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-600">
            🚿 Shower Station
          </CardTitle>
          <p className="text-gray-600">เข้าสู่ระบบเพื่อใช้บริการ</p>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Button 
              onClick={handleLineLogin}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3"
              disabled={isLoading}
            >
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : '🟢 เข้าใช้งานด้วย LINE'}
            </Button>
            <p className="text-xs text-center text-gray-500 mt-2">
              สำหรับสมาชิกที่ลงทะเบียนแล้ว
            </p>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">หรือ</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            <div>
              <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0xx-xxx-xxxx"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วยเบอร์โทร'}
            </Button>
          </form>
          
          <div className="text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">ยังไม่มีบัญชี?</span>
              </div>
            </div>
            
            <Button
              variant="outline"
              className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
              onClick={handleRegister}
            >
              สมัครสมาชิกใหม่ 📝
            </Button>
          </div>
          
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h4 className="text-sm font-medium text-green-800 mb-2">📱 LINE Rich Menu</h4>
            <div className="text-xs text-green-700 space-y-1">
              <div>1️⃣ สมัครสมาชิก - ลงทะเบียนใหม่</div>
              <div>2️⃣ สมาชิก - เข้าใช้งาน</div>
              <div>3️⃣ ติดต่อสอบถาม</div>
              <div>4️⃣ ข้อมูลทั่วไป</div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700 text-center">
              💡 ในการใช้งานจริง จะเชื่อมต่อกับ LINE Login API
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
