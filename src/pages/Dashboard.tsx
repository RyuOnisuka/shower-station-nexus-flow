import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Droplets, Toilet } from 'lucide-react';
import { useQueues } from '@/hooks/useDatabase';
import { getQueueDisplayName } from '@/utils/queueUtils';

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: queues, refetch } = useQueues();
  const [currentQueue, setCurrentQueue] = useState(null);
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');

  useEffect(() => {
    const newQueue = localStorage.getItem('currentQueue');
    if (newQueue) {
      setCurrentQueue(JSON.parse(newQueue));
      localStorage.removeItem('currentQueue');
    } else {
      const userQueue = queues?.find(q => 
        q.user?.phone_number === userData.phone_number && 
        ['waiting', 'called', 'processing'].includes(q.status)
      );
      setCurrentQueue(userQueue || null);
    }
  }, [queues, userData.phone_number]);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'รอเรียกคิว';
      case 'called': return 'เรียกคิวแล้ว - รอชำระเงิน';
      case 'processing': return 'กำลังใช้บริการ';
      case 'completed': return 'ใช้บริการเสร็จสิ้น';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-400 text-white';
      case 'called': return 'bg-[#BFA14A] text-white';
      case 'processing': return 'bg-blue-400 text-white';
      case 'completed': return 'bg-gray-400 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'shower': return <Droplets className="h-5 w-5" style={{ color: '#BFA14A' }} />;
      case 'toilet': return <Toilet className="h-5 w-5" style={{ color: '#BFA14A' }} />;
      default: return <Droplets className="h-5 w-5" style={{ color: '#BFA14A' }} />;
    }
  };

  const getServiceText = (serviceType: string) => {
    switch (serviceType) {
      case 'shower': return 'อาบน้ำ';
      case 'toilet': return 'ห้องน้ำ';
      default: return 'อาบน้ำ';
    }
  };

  const handlePayment = () => {
    if (currentQueue?.status === 'called') {
      navigate('/upload-slip');
    } else {
      toast.error('คิวยังไม่ถูกเรียก');
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success('รีเฟรชข้อมูลแล้ว');
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => navigate('/service-selection')}
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
          <button
            onClick={handleRefresh}
            className="border border-[#BFA14A] text-[#BFA14A] rounded-md px-3 py-1 font-semibold hover:bg-[#BFA14A] hover:text-white transition"
          >
            รีเฟรช
          </button>
        </div>

        {/* Welcome Card */}
        <Card className="bg-white rounded-xl shadow-md border-0">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold text-[#BFA14A]">
              สวัสดี คุณ{userData.first_name} {userData.last_name}
            </h2>
            <p className="text-sm text-gray-700 mt-1">
              ประเภทสมาชิก: {
                userData.user_type === 'employee' ? 'พนักงาน' : 
                userData.user_type === 'dependent' ? 'ผู้ติดตาม' : 'ทั่วไป'
              }
            </p>
          </CardContent>
        </Card>

        {/* Current Queue Card */}
        {currentQueue ? (
          <Card className="bg-white rounded-xl shadow-md border-0">
            <CardHeader>
              <CardTitle className="text-center text-[#BFA14A]">คิวปัจจุบัน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2" style={{ color: '#BFA14A' }}>
                  {currentQueue.queue_number}
                </div>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  {getServiceIcon(currentQueue.service_type)}
                  <span className="text-sm text-gray-700">
                    {getQueueDisplayName(currentQueue.queue_number)}
                  </span>
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(currentQueue.status)}`}>
                  {getStatusText(currentQueue.status)}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">ประเภทบริการ:</span>
                  <div className="flex items-center space-x-1">
                    {getServiceIcon(currentQueue.service_type)}
                    <span className="font-medium text-[#BFA14A]">
                      {getServiceText(currentQueue.service_type)}
                    </span>
                  </div>
                </div>

                {currentQueue.booking_time && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">เวลาจอง:</span>
                    <span className="font-medium">
                      {new Date(currentQueue.booking_time).toLocaleTimeString('th-TH', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })} น.
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-gray-700">ราคา:</span>
                  <span className="font-medium text-lg text-[#BFA14A]">
                    ฿{currentQueue.price}
                  </span>
                </div>

                {currentQueue.locker_number && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">ตู้ล็อกเกอร์:</span>
                    <span className="font-bold text-[#BFA14A]">
                      {currentQueue.locker_number}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-gray-700">เวลาสร้างคิว:</span>
                  <span className="text-sm">
                    {new Date(currentQueue.created_at).toLocaleString('th-TH')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4">
                {currentQueue.status === 'called' && (
                  <button
                    onClick={handlePayment}
                    className="w-full border border-[#BFA14A] text-[#BFA14A] rounded-md font-semibold py-2 hover:bg-[#BFA14A] hover:text-white transition"
                  >
                    <CreditCard className="h-4 w-4 mr-2 inline-block" />
                    ชำระเงิน/อัปโหลดสลิป
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white rounded-xl shadow-md border-0">
            <CardContent className="p-6 text-center">
              <div className="text-lg text-gray-700">คุณไม่มีคิวที่กำลังใช้งาน</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
