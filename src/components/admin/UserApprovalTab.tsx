
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, User, Users } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type User = Database['public']['Tables']['users']['Row'];

interface UserApprovalTabProps {
  pendingUsers: User[];
  onApproveUser: (userId: string) => void;
  onRejectUser: (userId: string) => void;
  isLoading: boolean;
}

export const UserApprovalTab = ({ 
  pendingUsers, 
  onApproveUser, 
  onRejectUser, 
  isLoading 
}: UserApprovalTabProps) => {
  const getUserTypeText = (userType: string | null) => {
    switch (userType) {
      case 'employee': return 'พนักงาน';
      case 'dependent': return 'ผู้ติดตาม';
      case 'general': return 'ทั่วไป';
      default: return userType || 'ไม่ระบุ';
    }
  };

  const getUserTypeBadge = (userType: string | null) => {
    switch (userType) {
      case 'employee': return 'bg-blue-500';
      case 'dependent': return 'bg-purple-500';
      case 'general': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>รออนุมัติสมาชิกใหม่</span>
          {pendingUsers.length > 0 && (
            <Badge variant="secondary">{pendingUsers.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>ไม่มีสมาชิกที่รออนุมัติ</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ-นามสกุล</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>เบอร์โทร</TableHead>
                <TableHead>รหัสพนักงาน</TableHead>
                <TableHead>เบอร์ผู้ปกครอง</TableHead>
                <TableHead>วันที่สมัคร</TableHead>
                <TableHead>การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.first_name} {user.last_name}
                  </TableCell>
                  <TableCell>
                    <Badge className={getUserTypeBadge(user.user_type)}>
                      {getUserTypeText(user.user_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.phone_number}</TableCell>
                  <TableCell>{user.employee_id || '-'}</TableCell>
                  <TableCell>{user.guardian_phone || '-'}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('th-TH')}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => onApproveUser(user.id)}
                        disabled={isLoading}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        อนุมัติ
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onRejectUser(user.id)}
                        disabled={isLoading}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        ปฏิเสธ
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
