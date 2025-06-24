
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Users, Clock, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';

const AdminPanel = () => {
  const [queues, setQueues] = useState([
    { id: '1', queueNumber: 'MW-001', userName: 'สมชาย ใจดี', status: 'waiting', price: 50, createdAt: '10:30' },
    { id: '2', queueNumber: 'MW-002', userName: 'สมหญิง สุขใส', status: 'called', price: 50, createdAt: '10:45' },
    { id: '3', queueNumber: 'MW-003', userName: 'สมศักดิ์ รุ่งเรือง', status: 'processing', price: 50, createdAt: '11:00' }
  ]);

  const [pendingPayments] = useState([
    { 
      id: '1', 
      queueNumber: 'MW-002', 
      userName: 'สมหญิง สุขใส', 
      amount: 50, 
      slipUrl: '/placeholder.svg',
      uploadedAt: '11:15'
    }
  ]);

  const handleCallQueue = (queueId: string) => {
    setQueues(queues.map(q => 
      q.id === queueId ? { ...q, status: 'called' } : q
    ));
    toast.success('เรียกคิวสำเร็จ!');
  };

  const handleApprovePayment = (paymentId: string) => {
    toast.success('อนุมัติการชำระเงินสำเร็จ! ได้รับตู้ล็อกเกอร์ #A12');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">รอคิว</Badge>;
      case 'called':
        return <Badge className="bg-blue-500 hover:bg-blue-600">ถูกเรียก</Badge>;
      case 'processing':
        return <Badge className="bg-green-500 hover:bg-green-600">กำลังใช้งาน</Badge>;
      case 'completed':
        return <Badge className="bg-gray-500 hover:bg-gray-600">เสร็จสิ้น</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">
            🚿 Shower Station - Admin Panel
          </h1>
          <div className="text-sm text-gray-600">
            วันที่: {new Date().toLocaleDateString('th-TH')}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">คิวทั้งหมดวันนี้</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">รอเรียกคิว</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">เสร็จสิ้นแล้ว</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">รายได้วันนี้</p>
                  <p className="text-2xl font-bold">฿600</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Queue Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">จัดการคิว</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>หมายเลขคิว</TableHead>
                  <TableHead>ชื่อลูกค้า</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>เวลา</TableHead>
                  <TableHead>ราคา</TableHead>
                  <TableHead>การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queues.map((queue) => (
                  <TableRow key={queue.id}>
                    <TableCell className="font-medium">{queue.queueNumber}</TableCell>
                    <TableCell>{queue.userName}</TableCell>
                    <TableCell>{getStatusBadge(queue.status)}</TableCell>
                    <TableCell>{queue.createdAt}</TableCell>
                    <TableCell>฿{queue.price}</TableCell>
                    <TableCell>
                      {queue.status === 'waiting' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleCallQueue(queue.id)}
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          เรียกคิว
                        </Button>
                      )}
                      {queue.status === 'processing' && (
                        <Button size="sm" variant="outline">
                          Check-out
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Payment Verification */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <span>รายการรอตรวจสอบการชำระเงิน</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>หมายเลขคิว</TableHead>
                    <TableHead>ชื่อลูกค้า</TableHead>
                    <TableHead>จำนวนเงิน</TableHead>
                    <TableHead>เวลาอัปโหลด</TableHead>
                    <TableHead>สลิปการโอน</TableHead>
                    <TableHead>การจัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.queueNumber}</TableCell>
                      <TableCell>{payment.userName}</TableCell>
                      <TableCell>฿{payment.amount}</TableCell>
                      <TableCell>{payment.uploadedAt}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          ดูสลิป
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="space-x-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleApprovePayment(payment.id)}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            อนุมัติ
                          </Button>
                          <Button size="sm" variant="destructive">
                            ปฏิเสธ
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-gray-500 py-4">
                ไม่มีรายการรอตรวจสอบ
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
