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
import { userSchema, validateThaiPhoneNumber, sanitizeInput, isInputSafe } from '@/utils/validation';
import { useMonitoring } from '@/hooks/useMonitoring';
import { useRateLimit } from '@/utils/rateLimiter';

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { logAction, logError } = useMonitoring();
  const { checkRateLimit } = useRateLimit('queueCreation');

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Sanitize inputs
    const sanitizedData = {
      firstName: sanitizeInput(formData.firstName),
      lastName: sanitizeInput(formData.lastName),
      phoneNumber: sanitizeInput(formData.phoneNumber),
      email: formData.email ? sanitizeInput(formData.email) : '',
      gender: formData.gender,
      restroomPref: formData.restroomPref,
      userType: formData.userType,
      employeeId: sanitizeInput(formData.employeeId),
      guardianEmployeeId: sanitizeInput(formData.guardianEmployeeId),
      lineUserId: sanitizeInput(formData.lineUserId)
    };

    // Check for dangerous input
    if (!isInputSafe(formData.firstName) || !isInputSafe(formData.lastName)) {
      newErrors.general = 'ข้อมูลที่กรอกไม่ปลอดภัย กรุณาตรวจสอบอีกครั้ง';
    }

    // Validate required fields
    if (!sanitizedData.firstName.trim()) {
      newErrors.firstName = 'กรุณากรอกชื่อ';
    } else if (sanitizedData.firstName.length < 2) {
      newErrors.firstName = 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร';
    }

    if (!sanitizedData.lastName.trim()) {
      newErrors.lastName = 'กรุณากรอกนามสกุล';
    } else if (sanitizedData.lastName.length < 2) {
      newErrors.lastName = 'นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร';
    }

    if (!sanitizedData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'กรุณากรอกเบอร์โทรศัพท์';
    } else if (!validateThaiPhoneNumber(sanitizedData.phoneNumber)) {
      newErrors.phoneNumber = 'เบอร์โทรศัพท์ไม่ถูกต้อง';
    }

    // Validate email if provided
    if (sanitizedData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedData.email)) {
      newErrors.email = 'อีเมลไม่ถูกต้อง';
    }

    // Validate employee ID for employee type
    if (sanitizedData.userType === 'employee' && !sanitizedData.employeeId.trim()) {
      newErrors.employeeId = 'กรุณากรอกรหัสพนักงาน';
    }

    // Validate guardian employee ID for dependent type
    if (sanitizedData.userType === 'dependent' && !sanitizedData.guardianEmployeeId.trim()) {
      newErrors.guardianEmployeeId = 'กรุณากรอกรหัสพนักงานผู้ดูแล';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Log form submission attempt
    logAction('register_form_submitted', { userType: formData.userType });

    // Check rate limit
    const rateLimitResult = checkRateLimit(formData.phoneNumber);
    if (!rateLimitResult.allowed) {
      toast.error(`กรุณารอ ${rateLimitResult.retryAfter} วินาทีก่อนลองใหม่`);
      return;
    }

    if (!validateForm()) {
      toast.error('กรุณาตรวจสอบข้อมูลที่กรอก');
      return;
    }

    setIsLoading(true);

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
        first_name: sanitizeInput(formData.firstName),
        last_name: sanitizeInput(formData.lastName),
        email: formData.email ? sanitizeInput(formData.email) : null,
        gender: formData.gender,
        restroom_pref: formData.restroomPref,
        user_type: formData.userType,
        employee_id: formData.employeeId ? sanitizeInput(formData.employeeId) : null,
        guardian_phone: formData.guardianEmployeeId ? sanitizeInput(formData.guardianEmployeeId) : null,
        line_user_id: formData.lineUserId ? sanitizeInput(formData.lineUserId) : null,
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
        logError(new Error(`Registration failed: ${error.message}`));
        
        if (error.code === '42501') {
          toast.error('ขณะนี้ระบบไม่สามารถลงทะเบียนได้ กรุณาลองใหม่อีกครั้ง');
        } else {
          toast.error('เกิดข้อผิดพลาดในการลงทะเบียน: ' + error.message);
        }
        setIsLoading(false);
        return;
      }

      console.log('User created successfully:', newUser);
      logAction('user_registered_successfully', { 
        userId: newUser.id, 
        userType: formData.userType 
      });

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
      logError(error instanceof Error ? error : new Error('Unknown registration error'));
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
              {errors.general && (
                <div className="text-red-500 text-sm bg-red-50 p-2 rounded">
                  {errors.general}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-gray-700">ชื่อ *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="ชื่อจริง"
                    required
                    className={`rounded-md border-[#BFA14A] focus:border-[#BFA14A] focus:ring-[#BFA14A] bg-[#FAF6EF] text-gray-800 ${
                      errors.firstName ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-gray-700">นามสกุล *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="นามสกุล"
                    required
                    className={`rounded-md border-[#BFA14A] focus:border-[#BFA14A] focus:ring-[#BFA14A] bg-[#FAF6EF] text-gray-800 ${
                      errors.lastName ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="phoneNumber" className="text-gray-700">เบอร์โทรศัพท์ *</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="0812345678"
                  required
                  className={`rounded-md border-[#BFA14A] focus:border-[#BFA14A] focus:ring-[#BFA14A] bg-[#FAF6EF] text-gray-800 ${
                    errors.phoneNumber ? 'border-red-500' : ''
                  }`}
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="text-gray-700">อีเมล (ไม่บังคับ)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="example@email.com"
                  className={`rounded-md border-[#BFA14A] focus:border-[#BFA14A] focus:ring-[#BFA14A] bg-[#FAF6EF] text-gray-800 ${
                    errors.email ? 'border-red-500' : ''
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label className="text-gray-700">เพศ *</Label>
                <RadioGroup
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange('gender', value)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">ชาย</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">หญิง</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unspecified" id="unspecified" />
                    <Label htmlFor="unspecified">ไม่ระบุ</Label>
                  </div>
                </RadioGroup>
              </div>

              {showRestroomChoice && (
                <div>
                  <Label className="text-gray-700">ห้องน้ำที่ต้องการ</Label>
                  <RadioGroup
                    value={formData.restroomPref}
                    onValueChange={(value) => handleInputChange('restroomPref', value)}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="restroom-male" />
                      <Label htmlFor="restroom-male">ชาย</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="restroom-female" />
                      <Label htmlFor="restroom-female">หญิง</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              <div>
                <Label className="text-gray-700">ประเภทผู้ใช้ *</Label>
                <RadioGroup
                  value={formData.userType}
                  onValueChange={(value) => handleInputChange('userType', value)}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="general" id="general" />
                    <Label htmlFor="general">สมาชิกทั่วไป</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="employee" id="employee" />
                    <Label htmlFor="employee">พนักงาน</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dependent" id="dependent" />
                    <Label htmlFor="dependent">ผู้อยู่ในอุปการะ</Label>
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
                    placeholder="รหัสพนักงาน"
                    required
                    className={`rounded-md border-[#BFA14A] focus:border-[#BFA14A] focus:ring-[#BFA14A] bg-[#FAF6EF] text-gray-800 ${
                      errors.employeeId ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.employeeId && (
                    <p className="text-red-500 text-xs mt-1">{errors.employeeId}</p>
                  )}
                </div>
              )}

              {formData.userType === 'dependent' && (
                <div>
                  <Label htmlFor="guardianEmployeeId" className="text-gray-700">รหัสพนักงานผู้ดูแล *</Label>
                  <Input
                    id="guardianEmployeeId"
                    value={formData.guardianEmployeeId}
                    onChange={(e) => handleInputChange('guardianEmployeeId', e.target.value)}
                    placeholder="รหัสพนักงานผู้ดูแล"
                    required
                    className={`rounded-md border-[#BFA14A] focus:border-[#BFA14A] focus:ring-[#BFA14A] bg-[#FAF6EF] text-gray-800 ${
                      errors.guardianEmployeeId ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.guardianEmployeeId && (
                    <p className="text-red-500 text-xs mt-1">{errors.guardianEmployeeId}</p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#BFA14A] hover:bg-[#A89040] text-white rounded-md py-2"
              >
                {isLoading ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
