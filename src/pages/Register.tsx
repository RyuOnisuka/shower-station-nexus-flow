
import { useState } from 'react';
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
    guardianEmployeeId: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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
      // Save user to database if employee or dependent
      if (formData.userType === 'employee' || formData.userType === 'dependent') {
        const { error } = await supabase
          .from('users')
          .insert({
            phone_number: formData.phoneNumber,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email || null,
            gender: formData.gender,
            restroom_pref: formData.restroomPref,
            user_type: formData.userType,
            employee_id: formData.employeeId || null,
            guardian_phone: formData.guardianEmployeeId || null,
            status: 'pending'
          });

        if (error) throw error;
        toast.success('ลงทะเบียนสำเร็จ! รอการอนุมัติจากแอดมิน');
      } else {
        toast.success('ลงทะเบียนสำเร็จ!');
      }

      // Store user data in localStorage
      const userData = {
        phone_number: formData.phoneNumber,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        gender: formData.gender,
        restroom_pref: formData.restroomPref,
        user_type: formData.userType,
        employee_id: formData.employeeId,
        guardian_phone: formData.guardianEmployeeId
      };
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Navigate to service selection
      setTimeout(() => {
        navigate('/service-selection');
      }, 1000);
      
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('เกิดข้อผิดพลาดในการลงทะเบียน');
    } finally {
      setIsLoading(false);
    }
  };

  const showRestroomChoice = formData.gender === 'unspecified';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/login')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold text-blue-600">
              🚿 Shower Station
            </h1>
            <p className="text-gray-600">ลงทะเบียนสมาชิกใหม่</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">ข้อมูลส่วนตัว</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">ชื่อ *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="ชื่อจริง"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">นามสกุล *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="นามสกุล"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phoneNumber">เบอร์โทรศัพท์ *</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="0xx-xxx-xxxx"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <Label className="text-base font-medium">เพศ</Label>
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
                  <Label className="text-base font-medium">ห้องน้ำที่ต้องการใช้</Label>
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
                <Label className="text-base font-medium">ประเภทสมาชิก</Label>
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
                  <Label htmlFor="employeeId">รหัสพนักงาน *</Label>
                  <Input
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={(e) => handleInputChange('employeeId', e.target.value)}
                    placeholder="EMP12345"
                    required
                  />
                  <p className="text-xs text-amber-600 mt-1">
                    * ต้องรอการอนุมัติจากแอดมิน
                  </p>
                </div>
              )}

              {formData.userType === 'dependent' && (
                <div>
                  <Label htmlFor="guardianEmployeeId">รหัสพนักงานผู้ดูแล *</Label>
                  <Input
                    id="guardianEmployeeId"
                    value={formData.guardianEmployeeId}
                    onChange={(e) => handleInputChange('guardianEmployeeId', e.target.value)}
                    placeholder="EMP12345"
                    required
                  />
                  <p className="text-xs text-amber-600 mt-1">
                    * ต้องรอการอนุมัติจากแอดมิน
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-600">
                การลงทะเบียนแสดงว่าคุณยอมรับ
                <br />
                <span className="text-blue-600 underline cursor-pointer">
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
