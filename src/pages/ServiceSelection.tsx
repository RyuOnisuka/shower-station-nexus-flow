import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Droplets, Toilet, Users } from 'lucide-react';
import { useCreateQueue } from '@/hooks/useDatabase';

const ServiceSelection = () => {
  const [selectedService, setSelectedService] = useState<'shower' | 'toilet' | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const navigate = useNavigate();
  const createQueueMutation = useCreateQueue();

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  
  useEffect(() => {
    if (!userData.phone_number || !userData.first_name || !userData.last_name) {
      toast.error('ข้อมูลผู้ใช้ไม่ครบถ้วน กรุณาลงทะเบียนใหม่');
      navigate('/register');
      return;
    }

    if (isBooking) {
      const generateAvailableTimes = () => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const times: string[] = [];
        
        const startHour = 7;
        const endHour = 21;
        
        for (let hour = startHour; hour < endHour; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
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
  }, [isBooking, userData, navigate]);

  const getPriceByUserType = (userType: string): number => {
    switch (userType) {
      case 'employee': return 50;
      case 'dependent': return 70;
      default: return 100;
    }
  };

  const getUserTypeDisplay = (userType: string): string => {
    switch (userType) {
      case 'employee': return 'พนักงาน';
      case 'dependent': return 'ผู้ติดตาม';
      default: return 'ทั่วไป';
    }
  };

  const handleServiceSelect = (service: 'shower' | 'toilet') => {
    setSelectedService(service);
    setSelectedTime('');
  };

  const handleConfirm = async () => {
    if (!selectedService) {
      toast.error('กรุณาเลือกประเภทบริการ');
      return;
    }

    if (isBooking && !selectedTime) {
      toast.error('กรุณาเลือกเวลาที่ต้องการจอง');
      return;
    }

    try {
      console.log('Creating queue with data:', {
        phone_number: userData.phone_number,
        first_name: userData.first_name,
        last_name: userData.last_name,
        gender: userData.gender || 'male',
        restroom_pref: userData.restroom_pref || 'male',
        service_type: selectedService,
        user_type: userData.user_type || 'general',
        booking_time: isBooking ? selectedTime : undefined
      });

      const queue = await createQueueMutation.mutateAsync({
        phone_number: userData.phone_number,
        first_name: userData.first_name,
        last_name: userData.last_name,
        gender: userData.gender || 'male',
        restroom_pref: userData.restroom_pref || 'male',
        service_type: selectedService,
        user_type: userData.user_type || 'general',
        booking_time: isBooking ? selectedTime : undefined
      });

      console.log('Queue created successfully:', queue);
      
      // Store queue data for dashboard display
      localStorage.setItem('currentQueue', JSON.stringify({
        ...queue,
        serviceType: selectedService,
        bookingTime: selectedTime
      }));
      
      toast.success('สร้างคิวสำเร็จ!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Queue creation error:', error);
      toast.error('เกิดข้อผิดพลาดในการสร้างคิว: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const price = getPriceByUserType(userData.user_type || 'general');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold text-gray-800">เลือกประเภทบริการ</h1>
        </div>

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
                ประเภทสมาชิก: {getUserTypeDisplay(userData.user_type)}
              </p>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              ราคา ฿{price}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-gray-800">เลือกประเภทบริการ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup 
              value={selectedService || ''} 
              onValueChange={(value) => handleServiceSelect(value as 'shower' | 'toilet')}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors">
                <RadioGroupItem value="shower" id="shower" />
                <Label htmlFor="shower" className="flex-1 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Droplets className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">อาบน้ำ</div>
                      <div className="text-sm text-gray-600">บริการอาบน้ำ</div>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors">
                <RadioGroupItem value="toilet" id="toilet" />
                <Label htmlFor="toilet" className="flex-1 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Toilet className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">ห้องน้ำ</div>
                      <div className="text-sm text-gray-600">บริการห้องน้ำ</div>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {/* Booking Option */}
            <div className="pt-4 border-t">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="booking"
                  checked={isBooking}
                  onChange={(e) => setIsBooking(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="booking" className="text-sm text-gray-700">
                  จองเวลาล่วงหน้า (ไม่บังคับ)
                </Label>
              </div>
            </div>

            {isBooking && (
              <div className="space-y-2">
                <Label htmlFor="booking-time">เลือกเวลา</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกเวลาที่ต้องการ" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimes.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button 
              onClick={handleConfirm}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={createQueueMutation.isPending}
            >
              {createQueueMutation.isPending ? 'กำลังสร้างคิว...' : 'สร้างคิว'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ServiceSelection;
