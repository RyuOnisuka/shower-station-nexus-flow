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
      const { data: existingUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .maybeSingle();
      if (error) {
        toast.error('เกิดข้อผิดพลาดในการตรวจสอบผู้ใช้');
        return;
      }
      if (existingUser) {
        localStorage.setItem('userData', JSON.stringify(existingUser));
        toast.success('เข้าสู่ระบบสำเร็จ!');
        navigate('/service-selection');
      } else {
        toast.error('ไม่พบข้อมูลผู้ใช้ กรุณาลงทะเบียนก่อน');
        navigate('/register');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLineLogin = async () => {
    setIsLoading(true);
    try {
      const mockLineUserId = 'line_user_123';
      const { data: existingUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('line_user_id', mockLineUserId)
        .maybeSingle();
      if (error) {
        toast.error('เกิดข้อผิดพลาดในการตรวจสอบผู้ใช้ LINE');
        return;
      }
      if (existingUser) {
        localStorage.setItem('userData', JSON.stringify(existingUser));
        toast.success('เข้าสู่ระบบด้วย LINE สำเร็จ!');
        navigate('/service-selection');
      } else {
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
        toast.info('กรุณาลงทะเบียนผู้ใช้ใหม่เพิ่มเติม');
        navigate('/register');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย LINE');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-xl shadow-md">
        <CardHeader className="text-center pb-2">
          <div className="flex flex-col items-center mb-2">
            <div className="text-5xl mb-1" style={{ color: '#BFA14A' }}>🚿</div>
            <div className="text-2xl font-bold" style={{ color: '#BFA14A', letterSpacing: 1 }}>SHOWER STATION</div>
          </div>
          <p className="text-gray-700 text-sm">เข้าสู่ระบบเพื่อใช้งานบริการ</p>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <button
              onClick={handleLineLogin}
              className="w-full border border-[#BFA14A] text-[#BFA14A] rounded-md font-semibold py-3 mb-2 hover:bg-[#BFA14A] hover:text-white transition"
              disabled={isLoading}
            >
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : '🟢 เข้าใช้งานด้วย LINE'}
            </button>
            <p className="text-xs text-center text-gray-500 mt-2">
              สำหรับสมาชิกที่ลงทะเบียนแล้ว
            </p>
          </div>
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#FAF6EF] px-2 text-gray-400">หรือ</span>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            <div>
              <Label htmlFor="phone" className="text-gray-700">เบอร์โทรศัพท์</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0xx-xxx-xxxx"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="rounded-md border-[#BFA14A] focus:border-[#BFA14A] focus:ring-[#BFA14A] bg-[#FAF6EF] text-gray-800"
              />
            </div>
            <button
              type="submit"
              className="w-full border border-[#BFA14A] text-[#BFA14A] rounded-md font-semibold py-2 hover:bg-[#BFA14A] hover:text-white transition"
              disabled={isLoading}
            >
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วยเบอร์โทรศัพท์'}
            </button>
          </form>
          <div className="text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#FAF6EF] px-2 text-gray-400">ยังไม่มีบัญชี?</span>
              </div>
            </div>
            <button
              className="w-full border border-[#BFA14A] text-[#BFA14A] rounded-md font-semibold py-2 hover:bg-[#BFA14A] hover:text-white transition"
              onClick={handleRegister}
            >
              สมัครสมาชิกใหม่ 📝
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
