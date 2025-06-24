
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, DollarSign } from 'lucide-react';

const History = () => {
  const navigate = useNavigate();

  // Mock history data
  const historyData = [
    {
      id: '1',
      queueNumber: 'MW-001',
      date: '2024-06-24',
      time: '10:30',
      price: 50,
      lockerNumber: 'A12',
      status: 'completed',
      duration: '45 นาที'
    },
    {
      id: '2',
      queueNumber: 'MW-045',
      date: '2024-06-20',
      time: '14:15',
      price: 50,
      lockerNumber: 'B05',
      status: 'completed',
      duration: '38 นาที'
    },
    {
      id: '3',
      queueNumber: 'MW-023',
      date: '2024-06-18',
      time: '16:45',
      price: 50,
      lockerNumber: 'A08',
      status: 'completed',
      duration: '52 นาที'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600">เสร็จสิ้น</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">ยกเลิก</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">ประวัติการใช้บริการ</h1>
        </div>

        {/* Summary Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {historyData.length}
                </div>
                <div className="text-xs text-gray-600">ครั้งทั้งหมด</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  ฿{historyData.reduce((sum, item) => sum + item.price, 0)}
                </div>
                <div className="text-xs text-gray-600">ยอดรวม</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">45</div>
                <div className="text-xs text-gray-600">นาที เฉลี่ย</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History List */}
        <div className="space-y-3">
          {historyData.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold text-lg">
                      {item.queueNumber}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(item.date).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {item.time}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-semibold">ตู้ล็อกเกอร์</div>
                    <div className="text-blue-600">#{item.lockerNumber}</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-semibold">ระยะเวลา</div>
                    <div className="text-green-600">{item.duration}</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-semibold">ราคา</div>
                    <div className="text-purple-600 flex items-center justify-center">
                      <DollarSign className="h-3 w-3" />
                      {item.price}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {historyData.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <Calendar className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="font-semibold text-gray-600 mb-2">
                ยังไม่มีประวัติการใช้บริการ
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                เมื่อคุณใช้บริการแล้ว ประวัติจะแสดงที่นี่
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                เริ่มใช้บริการ
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default History;
