import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
      icon: <Clock className="h-6 w-6" />,
      color: 'bg-blue-500'
    },
    {
      id: 'booking',
      name: 'จองล่วงหน้า',
      description: 'จองเวลาใช้บริการล่วงหน้า',
      icon: <Calendar className="h-6 w-6" />,
      color: 'bg-green-500'
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
      // Get user info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('กรุณาเข้าสู่ระบบ');
        navigate('/login');
        return;
      }

      // Get user profile
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!userProfile) {
        toast.error('ไม่พบข้อมูลผู้ใช้');
        return;
      }

      // Determine gender for queue number
      let gender = 'unisex';
      if (userProfile.gender) {
        gender = userProfile.gender;
      }

      const queueNumber = generateQueueNumber(selectedBookingType, gender);
      const price = 50; // Default price for all services

      // Create queue
      const { data: queue, error } = await supabase
        .from('queues')
        .insert({
          user_id: user.id,
          queue_number: queueNumber,
          service_type: 'general', // General service type
          price: price,
          status: 'waiting',
          booking_time: selectedBookingType === 'booking' ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating queue:', error);
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
      console.error('Error:', error);
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">เลือกบริการ</h1>
        </div>

        {/* Current Queue Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>สถานะคิวปัจจุบัน</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="h-6 w-6 text-blue-600" />
                  <div>
                    <div className="font-semibold">Walk-in</div>
                    <div className="text-sm text-gray-600">มาใช้บริการทันที</div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg font-bold">
                  {getCurrentQueueCount('walkin')} คน
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-6 w-6 text-green-600" />
                  <div>
                    <div className="font-semibold">จองล่วงหน้า</div>
                    <div className="text-sm text-gray-600">จองเวลาใช้บริการ</div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg font-bold">
                  {getCurrentQueueCount('booking')} คน
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Type Selection */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">เลือกประเภทการจอง</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookingTypes.map((type) => (
              <Card
                key={type.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedBookingType === type.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedBookingType(type.id as BookingType)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${type.color} text-white`}>
                      {type.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{type.name}</h3>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Continue Button */}
        {selectedBookingType && (
          <div className="flex justify-center pt-6">
            <Button 
              onClick={handleServiceSelect}
              disabled={isLoading}
              size="lg"
              className="w-full max-w-md"
            >
              {isLoading ? 'กำลังสร้างคิว...' : 'ดำเนินการต่อ'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceSelection;
