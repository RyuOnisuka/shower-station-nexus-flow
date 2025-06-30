import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin, 
  User,
  Activity,
  Lock,
  Unlock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useSecuritySettings, useLoginAttempts, useSecurityAlerts, useIPCheck } from '@/hooks/useSecurity';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from 'sonner';

const SecurityDashboardTab: React.FC = () => {
  const { adminUser } = useAdminAuth();
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [selectedIP, setSelectedIP] = useState<string>('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const { settings, isLoading: settingsLoading, updateSecuritySettings } = useSecuritySettings();
  const { data: loginAttempts, isLoading: attemptsLoading, refetch: refetchLoginAttempts } = useLoginAttempts({ limit: 50 });
  const { data: alerts, isLoading: alertsLoading, resolveAlert, refetch: refetchAlerts } = useSecurityAlerts();
  const { ipInfo, isLoading: ipLoading, checkIP } = useIPCheck();

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchLoginAttempts();
      refetchAlerts();
      setLastRefresh(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [refetchLoginAttempts, refetchAlerts]);

  const handleRefresh = async () => {
    try {
      await Promise.all([refetchLoginAttempts(), refetchAlerts()]);
      setLastRefresh(new Date());
      toast.success('อัปเดตข้อมูลสำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveAlert.mutateAsync(alertId);
      toast.success('แก้ไขการแจ้งเตือนสำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleCheckIP = async (ip: string) => {
    setSelectedIP(ip);
    await checkIP(ip);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'failed_login': return <Lock className="h-4 w-4" />;
      case 'suspicious_activity': return <AlertTriangle className="h-4 w-4" />;
      case 'unauthorized_access': return <XCircle className="h-4 w-4" />;
      case 'data_breach': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH');
  };

  if (settingsLoading || attemptsLoading || alertsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#BFA14A]"></div>
      </div>
    );
  }

  const recentFailedAttempts = loginAttempts?.filter(attempt => !attempt.success).slice(0, 10) || [];

  // Robust check for active alerts
  const isActive = (resolved: any) =>
    resolved === false ||
    resolved === null ||
    resolved === undefined ||
    resolved === 'false' ||
    resolved === 0 ||
    resolved === '0';

  const activeAlerts = alerts?.filter(alert => isActive(alert.resolved)) || [];
  const resolvedAlerts = alerts?.filter(alert => !isActive(alert.resolved)) || [];

  console.log('Security Dashboard Data:', {
    loginAttempts: loginAttempts?.length || 0,
    recentFailedAttempts: recentFailedAttempts.length,
    alerts: alerts?.length || 0,
    activeAlerts: activeAlerts.length,
    settings: settings
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Security Dashboard</h2>
          <p className="text-gray-600">ระบบความปลอดภัยและการตรวจสอบ</p>
          <p className="text-xs text-gray-500">
            อัปเดตล่าสุด: {lastRefresh.toLocaleTimeString('th-TH')}
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          อัปเดต
        </Button>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-[#BFA14A]" />
              <div>
                <p className="text-sm text-gray-600">Security Status</p>
                <p className="text-lg font-bold text-green-600">Secure</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-[#BFA14A]" />
              <div>
                <p className="text-sm text-gray-600">Active Alerts</p>
                <p className="text-lg font-bold text-red-600">{activeAlerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-[#BFA14A]" />
              <div>
                <p className="text-sm text-gray-600">Failed Logins (24h)</p>
                <p className="text-lg font-bold text-orange-600">
                  {recentFailedAttempts.filter(attempt => 
                    new Date(attempt.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-[#BFA14A]" />
              <div>
                <p className="text-sm text-gray-600">Resolved Alerts</p>
                <p className="text-lg font-bold text-green-600">{resolvedAlerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Security Alerts</span>
            {activeAlerts.length > 0 && (
              <Badge variant="destructive">{activeAlerts.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeAlerts.length > 0 ? (
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-gray-500">{formatDate(alert.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAlert(alert);
                        setIsAlertDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolveAlert(alert.id)}
                      disabled={resolveAlert.isPending}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>ไม่มี Security Alerts ที่ต้องแก้ไข</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Login Attempts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Recent Login Attempts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เวลา</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>รายละเอียด</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentFailedAttempts.map((attempt) => (
                <TableRow key={attempt.id}>
                  <TableCell className="text-sm">
                    {formatDate(attempt.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{attempt.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{attempt.ip_address}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCheckIP(attempt.ip_address)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={attempt.success ? "default" : "destructive"}>
                      {attempt.success ? 'สำเร็จ' : 'ล้มเหลว'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {attempt.user_agent?.substring(0, 50)}...
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {recentFailedAttempts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              ไม่พบการพยายามเข้าสู่ระบบล่าสุด
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Settings Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5" />
            <span>Security Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Login Protection</h4>
              <p className="text-sm text-gray-600">
                Max attempts: {settings?.max_login_attempts || 5}<br />
                Lockout duration: {settings?.lockout_duration || 30} minutes
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Session Management</h4>
              <p className="text-sm text-gray-600">
                Session timeout: {settings?.session_timeout || 480} minutes<br />
                2FA required: {settings?.require_2fa ? 'Yes' : 'No'}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Password Policy</h4>
              <p className="text-sm text-gray-600">
                Min length: {settings?.password_policy?.min_length || 8}<br />
                Complexity: {settings?.password_policy?.require_uppercase ? 'High' : 'Standard'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Detail Dialog */}
      <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>รายละเอียด Security Alert</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Type</p>
                  <p className="text-sm">{selectedAlert.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Severity</p>
                  <Badge className={getSeverityColor(selectedAlert.severity)}>
                    {selectedAlert.severity}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">เวลา</p>
                  <p className="text-sm">{formatDate(selectedAlert.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">สถานะ</p>
                  <Badge variant={selectedAlert.resolved ? "default" : "destructive"}>
                    {selectedAlert.resolved ? 'แก้ไขแล้ว' : 'ยังไม่แก้ไข'}
                  </Badge>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium">ข้อความ</p>
                <p className="text-sm">{selectedAlert.message}</p>
              </div>
              
              {selectedAlert.details && (
                <div>
                  <p className="text-sm font-medium">รายละเอียด</p>
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(selectedAlert.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* IP Info Dialog */}
      {ipInfo && (
        <Dialog open={!!ipInfo} onOpenChange={() => setSelectedIP('')}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>IP Information: {selectedIP}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Country</p>
                  <p className="text-sm">{ipInfo.country_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">City</p>
                  <p className="text-sm">{ipInfo.city || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">ISP</p>
                  <p className="text-sm">{ipInfo.org || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Timezone</p>
                  <p className="text-sm">{ipInfo.timezone || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SecurityDashboardTab; 