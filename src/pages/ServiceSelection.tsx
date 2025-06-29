import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Calendar, Users } from 'lucide-react';
import { useQueues } from '@/hooks/useDatabase';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getPriceByUserType } from '@/utils/queueUtils';

type BookingType = 'walkin' | 'booking';

const ServiceSelection = () => {
  const navigate = useNavigate();
  const [selectedBookingType, setSelectedBookingType] = useState<BookingType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { data: queues } = useQueues();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedBookingTime, setSelectedBookingTime] = useState<string | null>(null);

  const bookingTypes = [
    {
      id: 'walkin',
      name: 'Walk-in',
      description: 'มาใช้บริการทันที',
      icon: <Clock className="h-6 w-6" style={{ color: '#BFA14A' }} />,
      color: 'bg-[#F3EAD6]'
    },
    {
      id: 'booking',
      name: 'จองล่วงหน้า',
      description: 'จองเวลาใช้บริการล่วงหน้า',
      icon: <Calendar className="h-6 w-6" style={{ color: '#BFA14A' }} />,
      color: 'bg-[#F3EAD6]'
    }
  ];

  const getCurrentQueueCount = (bookingType: BookingType) => {
    return queues?.filter(q => 
      (bookingType === 'walkin' ? !q.booking_time : q.booking_time) &&
      ['waiting', 'called', 'processing'].includes(q.status)
    ).length || 0;
  };

  const generateQueueNumber = (bookingType: BookingType, gender: string, restroomPref: string, queues: any[]) => {
    const today = new Date().toISOString().split('T')[0];
    let genderPrefix = 'U';
    if (gender === 'male') genderPrefix = 'M';
    else if (gender === 'female') genderPrefix = 'F';
    else if (restroomPref === 'male') genderPrefix = 'M';
    else if (restroomPref === 'female') genderPrefix = 'F';

    const typePrefix = bookingType === 'walkin' ? 'W' : 'B';
    const prefix = `${genderPrefix}${typePrefix}-`;

    // filter queues for today, this type, and this gender
    const todayQueues = queues?.filter(q =>
      q.created_at?.startsWith(today) &&
      q.queue_number?.startsWith(prefix)
    ) || [];

    // หาเลขที่มากที่สุดในวันนี้
    let maxNumber = 0;
    todayQueues.forEach(q => {
      const match = q.queue_number.match(/-(\d{3})$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    });

    const nextNumber = maxNumber + 1;
    const formattedNumber = nextNumber.toString().padStart(3, '0');
    return `${prefix}${formattedNumber}`;
  };

  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0, 0); // เริ่ม 07:00
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 30, 0, 0); // สิ้นสุด 22:30
    let slot = new Date(start);
    while (slot <= end) {
      // แสดงเฉพาะเวลาตั้งแต่เวลาปัจจุบันขึ้นไป
      if (slot >= now) {
        slots.push(new Date(slot));
      }
      slot.setMinutes(slot.getMinutes() + 30);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleServiceSelect = async () => {
    if (!selectedBookingType) {
      toast.error('กรุณาเลือกประเภทการจอง');
      return;
    }
    if (!userProfile) {
      toast.error('กรุณาเข้าสู่ระบบ');
      navigate('/login');
      return;
    }
    if (selectedBookingType === 'booking' && !selectedBookingTime) {
      toast.error('กรุณาเลือกเวลาจอง');
      return;
    }
    setIsLoading(true);
    try {
      const gender = userProfile.gender || 'unspecific';
      const restroomPref = userProfile.restroom_pref || 'male';
      const price = getPriceByUserType(userProfile.user_type);
      const bookingTime = selectedBookingType === 'booking' ? selectedBookingTime : null;
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      let genkey;
      let queue = null;
      let error = null;
      let retry = 0;
      const maxRetry = 5;

      while (retry < maxRetry) {
        genkey = generateQueueNumber(
          selectedBookingType,
          gender,
          restroomPref,
          (queues || []).filter(q => q.created_at?.startsWith(today))
        );
        const result = await supabase
          .from('queues')
          .insert({
            user_id: userProfile.id,
            genkey: genkey,
            createdate: today,
            queue_number: genkey, // สำหรับแสดงผล
            service_type: selectedBookingType === 'walkin' ? 'Walk-in' : 'Booking',
            price: price,
            status: 'waiting',
            booking_time: bookingTime
          })
          .select()
          .single();
        queue = result.data;
        error = result.error;
        if (!error || !String(error.message).includes('duplicate key value')) break;
        retry++;
      }

      if (error) {
        toast.error('เกิดข้อผิดพลาดในการสร้างคิว: ' + error.message);
        return;
      }
      toast.success(`สร้างคิวสำเร็จ: ${genkey}`);
      navigate('/dashboard');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (!userData) {
      toast.error('กรุณาเข้าสู่ระบบ');
      navigate('/login');
      return;
    }
    setUserProfile(JSON.parse(userData));
  }, [navigate]);

  useEffect(() => {
    if (!userProfile || !queues) return;
    const hasActiveQueue = queues.some(q =>
      q.user?.phone_number === userProfile.phone_number &&
      ['waiting', 'called', 'payment_pending', 'processing'].includes(q.status)
    );
    if (hasActiveQueue) {
      navigate('/dashboard');
    }
  }, [userProfile, queues, navigate]);

  return (
    <div className="min-h-screen bg-[#FAF6EF] p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="border-none bg-transparent"
          >
            <span className="inline-flex items-center justify-center rounded-full p-1 hover:bg-[#F3EAD6]">
              <ArrowLeft className="h-5 w-5 text-[#BFA14A]" />
            </span>
          </button>
          <div className="flex flex-col items-center">
            <div className="text-2xl mb-1" style={{ color: '#BFA14A' }}>🚿</div>
            <span className="text-lg font-bold" style={{ color: '#BFA14A' }}>SHOWER STATION</span>
          </div>
        </div>

        {/* Current Queue Status */}
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-[#BFA14A]">
              <Users className="h-5 w-5" style={{ color: '#BFA14A' }} />
              <span>สถานะคิวปัจจุบัน</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-[#F3EAD6] rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="h-6 w-6" style={{ color: '#BFA14A' }} />
                  <div>
                    <div className="font-semibold text-[#BFA14A]">Walk-in</div>
                    <div className="text-sm text-gray-700">มาใช้บริการทันที</div>
                  </div>
                </div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#BFA14A] text-white">
                  {getCurrentQueueCount('walkin')} คิว
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#F3EAD6] rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-6 w-6" style={{ color: '#BFA14A' }} />
                  <div>
                    <div className="font-semibold text-[#BFA14A]">จองล่วงหน้า</div>
                    <div className="text-sm text-gray-700">จองเวลาใช้บริการล่วงหน้า</div>
                  </div>
                </div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#BFA14A] text-white">
                  {getCurrentQueueCount('booking')} คิว
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Profile */}
        {userProfile && (
          <div className="mb-4 p-4 bg-[#F3EAD6] rounded-lg flex items-center gap-4">
            <span className="font-bold text-[#BFA14A]">
              {userProfile.first_name} {userProfile.last_name}
            </span>
            <span className="text-sm text-gray-700">
              ประเภท: {userProfile.user_type || 'ทั่วไป'}
            </span>
            <span className="text-sm text-gray-700">
              เบอร์: {userProfile.phone_number}
            </span>
          </div>
        )}

        {/* Booking Type Selection */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#BFA14A]">เลือกประเภทการจอง</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookingTypes.map((type) => (
              <Card
                key={type.id}
                className={`cursor-pointer rounded-xl shadow-md transition-all hover:shadow-lg ${
                  selectedBookingType === type.id ? 'ring-2 ring-[#BFA14A]' : ''
                }`}
                onClick={() => setSelectedBookingType(type.id as BookingType)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${type.color} text-[#BFA14A]`}>{type.icon}</div>
                    <div>
                      <div className="font-semibold text-[#BFA14A]">{type.name}</div>
                      <div className="text-sm text-gray-700">{type.description}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {selectedBookingType === 'booking' && (
            <div className="mb-4">
              <label className="block text-[#BFA14A] font-semibold mb-1">เลือกเวลาจอง</label>
              <select
                value={selectedBookingTime || ''}
                onChange={e => setSelectedBookingTime(e.target.value)}
                className="rounded-md border-[#BFA14A] focus:border-[#BFA14A] focus:ring-[#BFA14A] bg-[#FAF6EF] text-gray-800 px-2 py-1"
                required
              >
                <option value="" disabled>-- เลือกเวลา --</option>
                {timeSlots.map(slot => (
                  <option key={slot.toISOString()} value={slot.toISOString()}>
                    {slot.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={handleServiceSelect}
            className="w-full border border-[#BFA14A] text-[#BFA14A] rounded-md font-semibold py-2 hover:bg-[#BFA14A] hover:text-white transition"
            disabled={isLoading}
          >
            {isLoading ? 'กำลังดำเนินการ...' : 'ยืนยันการเลือก'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceSelection;