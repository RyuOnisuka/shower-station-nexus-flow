import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Filter, Eye, User, Activity, Clock, Database } from 'lucide-react';
import { useAuditLogs, useAuditLogStats } from '@/hooks/useAuditLogs';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const AuditLogsTab: React.FC = () => {
  const { adminUser } = useAdminAuth();
  const [filters, setFilters] = useState({
    action: '',
    table_name: '',
    date_from: '',
    date_to: '',
    limit: 50
  });
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const { data: auditLogs, isLoading } = useAuditLogs(filters);
  const { data: auditStats, isLoading: statsLoading } = useAuditLogStats();

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const openDetailDialog = (log: any) => {
    setSelectedLog(log);
    setIsDetailDialogOpen(true);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('create') || action.includes('approve')) return 'bg-green-100 text-green-800';
    if (action.includes('update') || action.includes('edit')) return 'bg-blue-100 text-blue-800';
    if (action.includes('delete') || action.includes('reject')) return 'bg-red-100 text-red-800';
    if (action.includes('login') || action.includes('logout')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getTableIcon = (tableName: string) => {
    switch (tableName) {
      case 'queues': return <Activity className="h-4 w-4" />;
      case 'lockers': return <Database className="h-4 w-4" />;
      case 'users': return <User className="h-4 w-4" />;
      case 'admin_users': return <User className="h-4 w-4" />;
      case 'payments': return <Activity className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH');
  };

  const renderJsonData = (data: any) => {
    if (!data) return <span className="text-gray-500">ไม่มีข้อมูล</span>;
    
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return (
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch {
      return <span className="text-sm">{String(data)}</span>;
    }
  };

  if (isLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#BFA14A]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Audit Logs</h2>
          <p className="text-gray-600">ประวัติการใช้งานระบบและกิจกรรมต่างๆ</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-[#BFA14A]" />
              <div>
                <p className="text-sm text-gray-600">Total Logs</p>
                <p className="text-2xl font-bold">{auditStats?.totalLogs || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-[#BFA14A]" />
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{Object.keys(auditStats?.userCounts || {}).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-[#BFA14A]" />
              <div>
                <p className="text-sm text-gray-600">Actions Today</p>
                <p className="text-2xl font-bold">
                  {auditLogs?.filter(log => 
                    new Date(log.created_at).toDateString() === new Date().toDateString()
                  ).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-[#BFA14A]" />
              <div>
                <p className="text-sm text-gray-600">Last Activity</p>
                <p className="text-sm font-medium">
                  {auditLogs?.[0] ? formatDate(auditLogs[0].created_at) : 'ไม่มี'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>ตัวกรอง</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="action-filter">Action</Label>
              <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือก Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="table-filter">Table</Label>
              <Select value={filters.table_name} onValueChange={(value) => handleFilterChange('table_name', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือก Table" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="queues">Queues</SelectItem>
                  <SelectItem value="lockers">Lockers</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="admin_users">Admin Users</SelectItem>
                  <SelectItem value="payments">Payments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="date-from">วันที่เริ่มต้น</Label>
              <Input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="date-to">วันที่สิ้นสุด</Label>
              <Input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="limit">จำนวนรายการ</Label>
              <Select value={filters.limit.toString()} onValueChange={(value) => handleFilterChange('limit', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>ประวัติการใช้งาน</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เวลา</TableHead>
                <TableHead>ผู้ใช้</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>รายละเอียด</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">
                    {formatDate(log.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">
                        {log.admin_user?.username || 'System'}
                      </span>
                      {log.admin_user?.role && (
                        <Badge variant="outline" className="text-xs">
                          {log.admin_user.role}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getActionBadgeColor(log.action)}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getTableIcon(log.table_name || '')}
                      <span>{log.table_name || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {log.ip_address || '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetailDialog(log)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {(!auditLogs || auditLogs.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              ไม่พบข้อมูล Audit Logs
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>รายละเอียด Audit Log</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Action</Label>
                  <p className="text-sm">{selectedLog.action}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Table</Label>
                  <p className="text-sm">{selectedLog.table_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Record ID</Label>
                  <p className="text-sm">{selectedLog.record_id || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">IP Address</Label>
                  <p className="text-sm">{selectedLog.ip_address || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">User Agent</Label>
                  <p className="text-sm text-gray-600">{selectedLog.user_agent || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">เวลา</Label>
                  <p className="text-sm">{formatDate(selectedLog.created_at)}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">ข้อมูลเดิม</Label>
                {renderJsonData(selectedLog.old_values)}
              </div>
              
              <div>
                <Label className="text-sm font-medium">ข้อมูลใหม่</Label>
                {renderJsonData(selectedLog.new_values)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLogsTab; 