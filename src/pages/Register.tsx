import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    gender: 'unspecified',
    restroomPref: 'male',
    userType: 'general',
    employeeId: '',
    guardianEmployeeId: '',
    lineUserId: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user came from LINE login
    const lineUserData = localStorage.getItem('lineUserData');
    if (lineUserData) {
      const lineData = JSON.parse(lineUserData);
      setFormData(prev => ({
        ...prev,
        firstName: lineData.first_name || '',
        lastName: lineData.last_name || '',
        lineUserId: lineData.line_user_id || ''
      }));
      localStorage.removeItem('lineUserData'); // Clean up
    }
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      if (field === 'gender') {
        if (value === 'male') {
          newData.restroomPref = 'male';
        } else if (value === 'female') {
          newData.restroomPref = 'female';
        }
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.firstName || !formData.lastName || !formData.phoneNumber) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็น');
      setIsLoading(false);
      return;
    }

    if (formData.userType === 'employee' && !formData.employeeId) {
      toast.error('กรุณากรอกรหัสพนักงาน');
      setIsLoading(false);
      return;
    }

    if (formData.userType === 'dependent' && !formData.guardianEmployeeId) {
      toast.error('กรุณากรอกรหัสพนักงานผู้ดูแล');
      setIsLoading(false);
      return;
    }

    try {
      // Check if phone number already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('phone_number', formData.phoneNumber)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing user:', checkError);
        throw new Error('เกิดข้อผิดพลาดในการตรวจสอบข้อมูล');
      }

      if (existingUser) {
        toast.error('เบอร์โทรศัพท์นี้ถูกใช้แล้ว');
        setIsLoading(false);
        return;
      }

      // For general users (no RLS needed) and pending approval users
      const userData = {
        phone_number: formData.phoneNumber,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email || null,
        gender: formData.gender,
        restroom_pref: formData.restroomPref,
        user_type: formData.userType,
        employee_id: formData.employeeId || null,
        guardian_phone: formData.guardianEmployeeId || null,
        line_user_id: formData.lineUserId || null,
        status: (formData.userType === 'employee' || formData.userType === 'dependent') ? 'pending' : 'active'
      };

      console.log('Creating user with data:', userData);

      // Direct insert without RLS concerns for registration
      const { data: newUser, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (error) {
        console.error('Registration error:', error);
        if (error.code === '42501') {
          toast.error('ขณะนี้ระบบไม่สามารถลงทะเบียนได้ กรุณาลองใหม่อีกครั้ง');
        } else {
          toast.error('เกิดข้อผิดพลาดในการลงทะเบียน: ' + error.message);
        }
        setIsLoading(false);
        return;
      }

      console.log('User created successfully:', newUser);

      // Store user data in localStorage
      localStorage.setItem('userData', JSON.stringify(newUser));
      
      if (formData.userType === 'employee' || formData.userType === 'dependent') {
        toast.success('ลงทะเบียนสำเร็จ! รอการอนุมัติจากแอดมิน');
        navigate('/login'); // Redirect to login for pending approval
      } else {
        toast.success('ลงทะเบียนสำเร็จ!');
        navigate('/service-selection');
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลงทะเบียน');
    } finally {
      setIsLoading(false);
    }
  };

  const showRestroomChoice = formData.gender === 'unspecified';

  return (
    <div className="min-h-screen bg-[#FAF6EF] p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mr-2 border-none bg-transparent"
          >
            <span className="inline-flex items-center justify-center rounded-full p-1 hover:bg-[#F3EAD6]">
              <ArrowLeft className="h-5 w-5 text-[#BFA14A]" />
            </span>
          </button>
          <div className="text-center flex-1">
            <div className="flex flex-col items-center">
              <div className="text-3xl mb-1" style={{ color: '#BFA14A' }}>🚿</div>
              <h1 className="text-2xl font-bold" style={{ color: '#BFA14A' }}>
                SHOWER STATION
              </h1>
            </div>
            <p className="text-gray-700">ลงทะเบียนสมาชิกใหม่</p>
          </div>
        </div>

        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-[#BFA14A]">ข้อมูลส่วนตัว</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-gray-700">ชื่อ *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="ชื่อจริง"
                    required
                    className="rounded-md border-[#BFA14A] focus:border-[#BFA14A] focus:ring-[#BFA14A] bg-[#FAF6EF] text-gray-800"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-gray-700">นามสกุล *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="นามสกุล"
                    required
                    className="rounded-md border-[#BFA14A] focus:border-[#BFA14A] focus:ring-[#BFA14A] bg-[#FAF6EF] text-gray-800"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phoneNumber" className="text-gray-700">เบอร์โทรศัพท์ *</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="0xx-xxx-xxxx"
                  required
                  className="rounded-md border-[#BFA14A] focus:border-[#BFA14A] focus:ring-[#BFA14A] bg-[#FAF6EF] text-gray-800"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-gray-700">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="example@email.com"
                  className="rounded-md border-[#BFA14A] focus:border-[#BFA14A] focus:ring-[#BFA14A] bg-[#FAF6EF] text-gray-800"
                />
              </div>

              <div>
                <Label className="text-base font-medium text-gray-700">เพศ</Label>
                <RadioGroup
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange('gender', value)}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">ชาย (ใช้ห้องน้ำชาย)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">หญิง (ใช้ห้องน้ำหญิง)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unspecified" id="unspecified" />
                    <Label htmlFor="unspecified">ไม่ระบุ</Label>
                  </div>
                </RadioGroup>
              </div>

              {showRestroomChoice && (
                <div>
                  <Label className="text-base font-medium text-gray-700">ห้องน้ำที่ต้องการใช้</Label>
                  <RadioGroup
                    value={formData.restroomPref}
                    onValueChange={(value) => handleInputChange('restroomPref', value)}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="restroom-male" />
                      <Label htmlFor="restroom-male">ห้องชาย</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="restroom-female" />
                      <Label htmlFor="restroom-female">ห้องหญิง</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              <div>
                <Label className="text-base font-medium text-gray-700">ประเภทสมาชิก</Label>
                <RadioGroup
                  value={formData.userType}
                  onValueChange={(value) => handleInputChange('userType', value)}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="general" id="general" />
                    <Label htmlFor="general">ผู้ใช้ทั่วไป</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="employee" id="employee" />
                    <Label htmlFor="employee">พนักงาน</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dependent" id="dependent" />
                    <Label htmlFor="dependent">ผู้ติดตาม/ครอบครัว</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.userType === 'employee' && (
                <div>
                  <Label htmlFor="employeeId" className="text-gray-700">รหัสพนักงาน *</Label>
                  <Input
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={(e) => handleInputChange('employeeId', e.target.value)}
                    placeholder="EMP12345"
                    required
                    className="rounded-md border-[#BFA14A] focus:border-[#BFA14A] focus:ring-[#BFA14A] bg-[#FAF6EF] text-gray-800"
                  />
                  <p className="text-xs text-amber-600 mt-1">
                    * ต้องรอการอนุมัติจากแอดมิน
                  </p>
                </div>
              )}

              {formData.userType === 'dependent' && (
                <div>
                  <Label htmlFor="guardianEmployeeId" className="text-gray-700">รหัสพนักงานผู้ดูแล *</Label>
                  <Input
                    id="guardianEmployeeId"
                    value={formData.guardianEmployeeId}
                    onChange={(e) => handleInputChange('guardianEmployeeId', e.target.value)}
                    placeholder="EMP12345"
                    required
                    className="rounded-md border-[#BFA14A] focus:border-[#BFA14A] focus:ring-[#BFA14A] bg-[#FAF6EF] text-gray-800"
                  />
                  <p className="text-xs text-amber-600 mt-1">
                    * ต้องรอการอนุมัติจากแอดมิน
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full border border-[#BFA14A] text-[#BFA14A] rounded-md font-semibold py-2 hover:bg-[#BFA14A] hover:text-white transition"
                disabled={isLoading}
              >
                {isLoading ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
              </button>
            </form>

            <div className="mt-6 p-4 bg-[#F3EAD6] rounded-lg text-center">
              <p className="text-xs text-gray-700">
                การลงทะเบียนแสดงว่าคุณยอมรับ
                <br />
                <span className="text-[#BFA14A] underline cursor-pointer">
                  ข้อกำหนดและเงื่อนไขการใช้บริการ
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
