import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trash2, User, Mail, Shield } from 'lucide-react';
import { useAdminUsers } from '@/hooks/useAdminAuth';
import { toast } from 'sonner';

const AdminUserManagementTab: React.FC = () => {
  const { adminUsers, isLoading, createAdminUser, updateAdminUser, deleteAdminUser } = useAdminUsers();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'staff' as 'super_admin' | 'admin' | 'staff'
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAdminUser.mutateAsync(formData);
      toast.success('สร้างผู้ดูแลระบบสำเร็จ');
      setIsCreateDialogOpen(false);
      setFormData({ username: '', email: '', password: '', role: 'staff' });
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการสร้างผู้ดูแลระบบ');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      const updates: any = {
        username: formData.username,
        email: formData.email,
        role: formData.role
      };
      
      if (formData.password) {
        updates.password_hash = `$2a$10$dummy.hash.for.${formData.username}`;
      }
      
      await updateAdminUser.mutateAsync({ id: editingUser.id, updates });
      toast.success('อัปเดตผู้ดูแลระบบสำเร็จ');
      setIsEditDialogOpen(false);
      setEditingUser(null);
      setFormData({ username: '', email: '', password: '', role: 'staff' });
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการอัปเดตผู้ดูแลระบบ');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ดูแลระบบคนนี้?')) return;
    
    try {
      await deleteAdminUser.mutateAsync(userId);
      toast.success('ลบผู้ดูแลระบบสำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการลบผู้ดูแลระบบ');
    }
  };

  const openEditDialog = (user: any) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role
    });
    setIsEditDialogOpen(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'staff': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'staff': return 'Staff';
      default: return role;
    }
  };

  if (isLoading) {
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
          <h2 className="text-2xl font-bold text-gray-800">จัดการผู้ดูแลระบบ</h2>
          <p className="text-gray-600">จัดการบัญชีผู้ดูแลระบบและสิทธิ์การเข้าถึง</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#BFA14A] hover:bg-[#A89040] text-white">
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มผู้ดูแลระบบ
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>เพิ่มผู้ดูแลระบบใหม่</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <Label htmlFor="username">ชื่อผู้ใช้</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">รหัสผ่าน</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">สิทธิ์</Label>
                <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={createAdminUser.isPending}>
                  {createAdminUser.isPending ? 'กำลังสร้าง...' : 'สร้าง'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {adminUsers?.map((user) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-[#BFA14A] rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-lg">{user.username}</h3>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      สร้างเมื่อ: {new Date(user.created_at).toLocaleDateString('th-TH')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(user)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={deleteAdminUser.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>แก้ไขผู้ดูแลระบบ</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div>
              <Label htmlFor="edit-username">ชื่อผู้ใช้</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-email">อีเมล</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-password">รหัสผ่าน (เว้นว่างถ้าไม่เปลี่ยน)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-role">สิทธิ์</Label>
              <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={updateAdminUser.isPending}>
                {updateAdminUser.isPending ? 'กำลังอัปเดต...' : 'อัปเดต'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserManagementTab; 