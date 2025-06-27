import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Calendar, Users } from 'lucide-react';
import { useQueues } from '@/hooks/useDatabase';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type BookingType = 'walkin' | 'booking';

const ServiceSelection = () => {
  const navigate = useNavigate();
  const [selectedBookingType, setSelectedBookingType] = useState<BookingType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { data: queues } = useQueues();

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

  const generateQueueNumber = (bookingType: BookingType, gender: string) => {
    const today = new Date().toISOString().split('T')[0];
    const existingQueues = queues?.filter(q => 
      (bookingType === 'walkin' ? !q.booking_time : q.booking_time) &&
      q.created_at?.startsWith(today)
    ) || [];

    const nextNumber = existingQueues.length + 1;
    const formattedNumber = nextNumber.toString().padStart(3, '0');
    
    const genderPrefix = gender === 'male' ? 'M' : gender === 'female' ? 'W' : 'U';
    const bookingPrefix = bookingType === 'walkin' ? 'W' : 'B';
    
    return `${genderPrefix}${bookingPrefix}-${formattedNumber}`;
  };

  const handleServiceSelect = async () => {
    if (!selectedBookingType) {
      toast.error('กรุณาเลือกประเภทการจอง');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('กรุณาเข้าสู่ระบบ');
        navigate('/login');
        return;
      }

      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!userProfile) {
        toast.error('ไม่พบข้อมูลผู้ใช้');
        return;
      }

      let gender = 'unisex';
      if (userProfile.gender) {
        gender = userProfile.gender;
      }

      const queueNumber = generateQueueNumber(selectedBookingType, gender);
      const price = 50;

      const { data: queue, error } = await supabase
        .from('queues')
        .insert({
          user_id: user.id,
          queue_number: queueNumber,
          service_type: 'general',
          price: price,
          status: 'waiting',
          booking_time: selectedBookingType === 'booking' ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (error) {
        toast.error('เกิดข้อผิดพลาดในการสร้างคิว');
        return;
      }

      toast.success(`สร้างคิวสำเร็จ: ${queueNumber}`);
      navigate('/upload-slip', { 
        state: { 
          queueId: queue.id,
          queueNumber: queueNumber,
          price: price
        } 
      });

    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  };

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
