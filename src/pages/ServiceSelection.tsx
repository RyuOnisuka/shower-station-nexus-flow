
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Users, Zap } from 'lucide-react';
import { useCreateQueue } from '@/hooks/useDatabase';

const ServiceSelection = () => {
  const [selectedService, setSelectedService] = useState<'walkin' | 'booking' | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const navigate = useNavigate();
  const createQueueMutation = useCreateQueue();

  // Get user data from localStorage (from registration/login)
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  
  // Generate available booking times based on current time
  useEffect(() => {
    if (selectedService === 'booking') {
      const generateAvailableTimes = () => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const times: string[] = [];
        
        // Shop hours: 7:00 - 21:00
        const startHour = 7;
        const endHour = 21;
        
        for (let hour = startHour; hour < endHour; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            // Skip times that have already passed today
            if (hour > currentHour || (hour === currentHour && minute > currentMinute)) {
              const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
              times.push(timeString);
            }
          }
        }
        
        return times;
      };
      
      setAvailableTimes(generateAvailableTimes());
    }
  }, [selectedService]);

  const getPriceByUserType = (userType: string): number => {
    switch (userType) {
      case 'employee': return 50;
      case 'follower': return 70;
      default: return 100; // general
    }
  };

  const handleServiceSelect = (service: 'walkin' | 'booking') => {
    setSelectedService(service);
    setSelectedTime('');
  };

  const handleConfirm = async () => {
    if (!userData.phone_number || !userData.first_name || !userData.last_name) {
      toast.error('ข้อมูลผู้ใช้ไม่ครบถ้วน กรุณาลงทะเบียนใหม่');
      navigate('/register');
      return;
    }

    if (!selectedService) {
      toast.error('กรุณาเลือกประเภทการใช้บริการ');
      return;
    }

    if (selectedService === 'booking' && !selectedTime) {
      toast.error('กรุณาเลือกเวลาที่ต้องการจอง');
      return;
    }

    try {
      console.log('Creating queue with data:', {
        phone_number: userData.phone_number,
        first_name: userData.first_name,
        last_name: userData.last_name,
        gender: userData.gender || 'unspecified',
        restroom_pref: userData.restroom_pref || 'male',
        service_type: selectedService,
        user_type: userData.user_type || 'general',
        booking_time: selectedService === 'booking' ? selectedTime : undefined
      });

      const queue = await createQueueMutation.mutateAsync({
        phone_number: userData.phone_number,
        first_name: userData.first_name,
        last_name: userData.last_name,
        gender: userData.gender || 'unspecified',
        restroom_pref: userData.restroom_pref || 'male',
        service_type: selectedService,
        user_type: userData.user_type || 'general',
        booking_time: selectedService === 'booking' ? selectedTime : undefined
      });

      console.log('Queue created successfully:', queue);
      
      toast.success('สร้างคิวสำเร็จ!');
      navigate('/upload-slip', { 
        state: { 
          queueData: queue,
          serviceType: selectedService,
          bookingTime: selectedTime
        } 
      });
    } catch (error) {
      console.error('Queue creation error:', error);
      toast.error('เกิดข้อผิดพลาดในการสร้างคิว: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const price = getPriceByUserType(userData.user_type || 'general');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold text-gray-800">เลือกประเภทการใช้บริการ</h1>
        </div>

        {/* Welcome Message */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">
                สวัสดี คุณ{userData.first_name} {userData.last_name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                ประเภทสมาชิก: {
                  userData.user_type === 'employee' ? 'พนักงาน' : 
                  userData.user_type === 'follower' ? 'ผู้ติดตาม' : 'ทั่วไป'
                }
              </p>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              ราคา ฿{price}
            </Badge>
          </CardContent>
        </Card>

        {/* Service Selection */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-gray-800">เลือกประเภทการใช้บริการ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup 
              value={selectedService || ''} 
              onValueChange={(value) => handleServiceSelect(value as 'walkin' | 'booking')}
              className="space-y-3"
            >
              {/* Walk-in Option */}
              <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors">
                <RadioGroupItem value="walkin" id="walkin" />
                <Label htmlFor="walkin" className="flex-1 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Zap className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">Walk-in</div>
                      <div className="text-sm text-gray-600">เข้าใช้บริการทันที</div>
                    </div>
                  </div>
                </Label>
              </div>

              {/* Booking Option */}
              <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors">
                <RadioGroupItem value="booking" id="booking" />
                <Label htmlFor="booking" className="flex-1 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">Booking</div>
                      <div className="text-sm text-gray-600">จองเวลาล่วงหน้า</div>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {/* Time Selection for Booking */}
            {selectedService === 'booking' && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  เลือกเวลาที่ต้องการจอง
                </Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="เลือกเวลา" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimes.length > 0 ? (
                      availableTimes.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time} น.
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-times" disabled>
                        ไม่มีช่วงเวลาที่สามารถจองได้วันนี้
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-2">
                  เวลาทำการ: 07:00 - 21:00 น.
                </p>
              </div>
            )}

            {/* Confirm Button */}
            <Button 
              onClick={handleConfirm}
              disabled={!selectedService || (selectedService === 'booking' && !selectedTime) || createQueueMutation.isPending}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
            >
              {createQueueMutation.isPending ? 'กำลังสร้างคิว...' : 'ยืนยันการเลือก'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ServiceSelection;
