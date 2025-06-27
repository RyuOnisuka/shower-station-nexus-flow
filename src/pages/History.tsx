import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin } from 'lucide-react';
import { useQueues } from '@/hooks/useDatabase';

const History = () => {
  const navigate = useNavigate();
  const { data: queues } = useQueues();
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');

  // Filter queues for current user only
  const userQueues = queues?.filter(q => 
    q.user?.phone_number === userData.phone_number
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'รอเรียกคิว';
      case 'called': return 'เรียกคิวแล้ว';
      case 'processing': return 'กำลังใช้บริการ';
      case 'completed': return 'ใช้บริการเสร็จสิ้น';
      case 'cancelled': return 'ยกเลิก';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-400 text-white';
      case 'called': return 'bg-[#BFA14A] text-white';
      case 'processing': return 'bg-blue-400 text-white';
      case 'completed': return 'bg-gray-400 text-white';
      case 'cancelled': return 'bg-red-400 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] p-4">
      <div className="max-w-md mx-auto space-y-6">
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

        {/* User Info */}
        <Card className="bg-white rounded-xl shadow-md border-0">
          <CardContent className="p-4">
            <div className="text-center">
              <h2 className="font-semibold text-[#BFA14A]">
                {userData.first_name} {userData.last_name}
              </h2>
              <p className="text-sm text-gray-700">
                เบอร์โทร: {userData.phone_number}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* History List */}
        <div className="space-y-4">
          {userQueues.length === 0 ? (
            <Card className="bg-white rounded-xl shadow-md border-0">
              <CardContent className="p-6 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h2 className="text-lg font-semibold text-[#BFA14A] mb-2">ไม่มีประวัติการใช้งาน</h2>
                <p className="text-gray-700 mb-4">คุณยังไม่เคยใช้บริการในระบบนี้</p>
                <button 
                  onClick={() => navigate('/service-selection')}
                  className="w-full border border-[#BFA14A] text-[#BFA14A] rounded-md font-semibold py-2 hover:bg-[#BFA14A] hover:text-white transition"
                >
                  สร้างคิวใหม่
                </button>
              </CardContent>
            </Card>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-[#BFA14A]">
                ประวัติทั้งหมด ({userQueues.length} รายการ)
              </h3>
              {userQueues.map((queue) => (
                <Card key={queue.id} className="bg-white rounded-xl shadow-md border-0">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg text-[#BFA14A]">
                        คิว {queue.queue_number}
                      </CardTitle>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(queue.status)}`}>
                        {getStatusText(queue.status)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex justify-between">
                        <span>วันที่:</span>
                        <span>{new Date(queue.created_at).toLocaleDateString('th-TH')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>เวลา:</span>
                        <span>{new Date(queue.created_at).toLocaleTimeString('th-TH')}</span>
                      </div>
                      {queue.booking_time && (
                        <div className="flex justify-between">
                          <span>เวลาจอง:</span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" style={{ color: '#BFA14A' }} />
                            {new Date(queue.booking_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>ราคา:</span>
                        <span className="font-semibold text-[#BFA14A]">฿{queue.price}</span>
                      </div>
                      {queue.locker_number && (
                        <div className="flex justify-between">
                          <span>ตู้ล็อกเกอร์:</span>
                          <span className="flex items-center text-[#BFA14A]">
                            <MapPin className="h-4 w-4 mr-1" style={{ color: '#BFA14A' }} />
                            {queue.locker_number}
                          </span>
                        </div>
                      )}
                      {queue.completed_at && (
                        <div className="flex justify-between">
                          <span>เสร็จสิ้นเมื่อ:</span>
                          <span>{new Date(queue.completed_at).toLocaleString('th-TH')}</span>
                        </div>
                      )}
                      {queue.payment && queue.payment.length > 0 && (
                        <div className="flex justify-between">
                          <span>การชำระเงิน:</span>
                          <span className={
                            queue.payment[0].status === 'approved' 
                              ? 'text-green-700' 
                              : queue.payment[0].status === 'pending'
                              ? 'text-yellow-700'
                              : 'text-red-700'
                          }>
                            {queue.payment[0].status === 'approved' ? 'อนุมัติแล้ว' : 
                             queue.payment[0].status === 'pending' ? 'รอตรวจสอบ' : 'ปฏิเสธ'}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
        <div className="space-y-2">
          <button 
            onClick={() => navigate('/service-selection')}
            className="w-full border border-[#BFA14A] text-[#BFA14A] rounded-md font-semibold py-2 hover:bg-[#BFA14A] hover:text-white transition"
          >
            สร้างคิวใหม่
          </button>
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full border border-[#BFA14A] text-[#BFA14A] rounded-md font-semibold py-2 hover:bg-[#BFA14A] hover:text-white transition"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    </div>
  );
};

export default History;
