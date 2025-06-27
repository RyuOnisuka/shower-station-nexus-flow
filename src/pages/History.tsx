
import { Button } from '@/components/ui/button';
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
      case 'waiting': return 'bg-yellow-500';
      case 'called': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold text-gray-800">ประวัติการใช้บริการ</h1>
        </div>

        {/* User Info */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-center">
              <h2 className="font-semibold text-gray-800">
                {userData.first_name} {userData.last_name}
              </h2>
              <p className="text-sm text-gray-600">
                เบอร์โทร: {userData.phone_number}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* History List */}
        <div className="space-y-4">
          {userQueues.length === 0 ? (
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">ไม่มีประวัติการใช้บริการ</h2>
                <p className="text-gray-600 mb-4">คุณยังไม่เคยใช้บริการในระบบนี้</p>
                <Button 
                  onClick={() => navigate('/service-selection')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  สร้างคิวใหม่
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-800">
                ประวัติทั้งหมด ({userQueues.length} รายการ)
              </h3>
              
              {userQueues.map((queue) => (
                <Card key={queue.id} className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">
                        คิว {queue.queue_number}
                      </CardTitle>
                      <Badge className={`${getStatusColor(queue.status)} hover:${getStatusColor(queue.status)}`}>
                        {getStatusText(queue.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">วันที่:</span>
                        <span>{new Date(queue.created_at).toLocaleDateString('th-TH')}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">เวลา:</span>
                        <span>{new Date(queue.created_at).toLocaleTimeString('th-TH')}</span>
                      </div>

                      {queue.booking_time && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">เวลาจอง:</span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {new Date(queue.booking_time).toLocaleTimeString('th-TH', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })} น.
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-gray-600">ราคา:</span>
                        <span className="font-semibold">฿{queue.price}</span>
                      </div>

                      {queue.locker_number && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">ตู้ล็อกเกอร์:</span>
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {queue.locker_number}
                          </span>
                        </div>
                      )}

                      {queue.completed_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">เสร็จสิ้นเมื่อ:</span>
                          <span>{new Date(queue.completed_at).toLocaleString('th-TH')}</span>
                        </div>
                      )}

                      {/* Payment Status */}
                      {queue.payment && queue.payment.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">การชำระเงิน:</span>
                          <Badge variant="outline" className={
                            queue.payment[0].status === 'approved' 
                              ? 'text-green-700 border-green-200' 
                              : queue.payment[0].status === 'pending'
                              ? 'text-yellow-700 border-yellow-200'
                              : 'text-red-700 border-red-200'
                          }>
                            {queue.payment[0].status === 'approved' ? 'อนุมัติแล้ว' : 
                             queue.payment[0].status === 'pending' ? 'รอตรวจสอบ' : 'ปฏิเสธ'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button 
            onClick={() => navigate('/service-selection')}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            สร้างคิวใหม่
          </Button>
          
          <Button 
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="w-full"
          >
            กลับหน้าหลัก
          </Button>
        </div>
      </div>
    </div>
  );
};

export default History;
