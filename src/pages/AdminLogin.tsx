import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { createAuditLog } from '@/hooks/useAuditLogs';
import { recordLoginAttempt, checkLoginAttempts } from '@/hooks/useSecurity';
import { useQueryClient } from '@tanstack/react-query';

const AdminLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { login } = useAdminAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // ตรวจสอบ login attempts
      const loginCheck = await checkLoginAttempts(username, '127.0.0.1');
      
      if (loginCheck.blocked) {
        setError(`บัญชีถูกบล็อกชั่วคราว กรุณาลองใหม่ในภายหลัง`);
        setIsBlocked(true);
        setIsLoading(false);
        return;
      }

      // อัปเดต remaining attempts ก่อน
      setRemainingAttempts(loginCheck.remainingAttempts);

      const result = await login({ username, password });

      // Invalidate queries เพื่อให้ Security Dashboard อัปเดต
      queryClient.invalidateQueries({ queryKey: ['login_attempts'] });
      queryClient.invalidateQueries({ queryKey: ['security_alerts'] });
      
      if (result.success) {
        // สร้าง audit log
        await createAuditLog({
          action: 'admin_login',
          table_name: 'admin_sessions',
          new_values: { 
            username: username,
            login_time: new Date().toISOString()
          },
          ip_address: '127.0.0.1',
          user_agent: navigator.userAgent
        });
        
        toast.success('เข้าสู่ระบบสำเร็จ');
        navigate('/admin');
      } else {
        // ตรวจสอบ login attempts อีกครั้งหลังจาก failed login
        const updatedLoginCheck = await checkLoginAttempts(username, '127.0.0.1');
        setRemainingAttempts(updatedLoginCheck.remainingAttempts);
        
        if (updatedLoginCheck.blocked) {
          setError(`รหัสผ่านไม่ถูกต้อง บัญชีถูกบล็อกชั่วคราว`);
          setIsBlocked(true);
        } else if (updatedLoginCheck.remainingAttempts <= 1) {
          setError(`รหัสผ่านไม่ถูกต้อง เหลือโอกาส ${updatedLoginCheck.remainingAttempts} ครั้ง`);
        } else {
          setError(`รหัสผ่านไม่ถูกต้อง เหลือโอกาส ${updatedLoginCheck.remainingAttempts} ครั้ง`);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3EAD6] to-[#E6D5B8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4 text-[#BFA14A] hover:text-[#8B7355]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับไปหน้าหลัก
        </Button>
        
        <Card className="bg-white/80 backdrop-blur-sm border-[#BFA14A] shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src="/shower-logo.svg" alt="Shower Station Logo" className="h-16 w-16" />
            </div>
            <CardTitle className="text-2xl font-bold text-[#8B7355]">เข้าสู่ระบบแอดมิน</CardTitle>
            <p className="text-gray-600">กรุณาเข้าสู่ระบบเพื่อจัดการระบบ</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-red-600 text-sm">{error}</span>
                  </div>
                </div>
              )}

              {isBlocked && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-orange-600 text-sm">
                      บัญชีถูกบล็อกชั่วคราวเพื่อความปลอดภัย
                    </span>
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="username" className="text-[#8B7355] font-medium">
                  ชื่อผู้ใช้
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="กรอกชื่อผู้ใช้"
                  className="border-[#BFA14A] focus:border-[#8B7355] focus:ring-[#8B7355]"
                  required
                  disabled={isBlocked}
                />
              </div>
              
              <div>
                <Label htmlFor="password" className="text-[#8B7355] font-medium">
                  รหัสผ่าน
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่าน"
                    className="border-[#BFA14A] focus:border-[#8B7355] focus:ring-[#8B7355] pr-10"
                    required
                    disabled={isBlocked}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isBlocked}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>

              {!isBlocked && remainingAttempts < 5 && (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-yellow-700 text-sm">
                    เหลือโอกาสเข้าสู่ระบบ {remainingAttempts} ครั้ง
                  </p>
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full bg-[#BFA14A] hover:bg-[#8B7355] text-white font-medium py-2"
                disabled={isLoading || isBlocked}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    กำลังเข้าสู่ระบบ...
                  </div>
                ) : (
                  'เข้าสู่ระบบ'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin; 