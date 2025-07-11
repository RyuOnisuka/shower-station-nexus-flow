import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, Clock, DollarSign, Users, Wrench, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSecuritySettings } from '@/hooks/useSecurity';

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string;
  updated_at: string;
}

const SystemSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);
  const [formData, setFormData] = useState({
    setting_key: '',
    setting_value: '',
    description: ''
  });
  const { settings: securitySettings, updateSecuritySettings } = useSecuritySettings();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดการตั้งค่า');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSetting = async (setting: SystemSetting, newValue: string) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ 
          setting_value: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', setting.id);

      if (error) throw error;
      
      if (setting.setting_key === 'max_login_attempts') {
        await updateSecuritySettings.mutateAsync({
          max_login_attempts: Number(newValue)
        });
      }
      
      await loadSettings();
      toast.success('บันทึกการตั้งค่าสำเร็จ');
    } catch (error) {
      console.error('Error saving setting:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
    }
  };

  const handleEditSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSetting) return;

    try {
      const { error } = await supabase
        .from('system_settings')
        .update({
          setting_value: formData.setting_value,
          description: formData.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingSetting.id);

      if (error) throw error;
      
      toast.success('อัปเดตการตั้งค่าสำเร็จ');
      setIsEditDialogOpen(false);
      setEditingSetting(null);
      setFormData({ setting_key: '', setting_value: '', description: '' });
      await loadSettings();
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดตการตั้งค่า');
    }
  };

  const openEditDialog = (setting: SystemSetting) => {
    setEditingSetting(setting);
    setFormData({
      setting_key: setting.setting_key,
      setting_value: setting.setting_value,
      description: setting.description
    });
    setIsEditDialogOpen(true);
  };

  const getSettingIcon = (key: string) => {
    if (key.includes('hours')) return <Clock className="h-5 w-5" />;
    if (key.includes('price')) return <DollarSign className="h-5 w-5" />;
    if (key.includes('max')) return <Users className="h-5 w-5" />;
    if (key.includes('auto') || key.includes('maintenance')) return <Wrench className="h-5 w-5" />;
    return <Settings className="h-5 w-5" />;
  };

  const getSettingType = (key: string) => {
    if (key.includes('price') || key.includes('max')) return 'number';
    if (key.includes('auto') || key.includes('maintenance')) return 'boolean';
    return 'text';
  };

  const renderSettingValue = (setting: SystemSetting) => {
    const type = getSettingType(setting.setting_key);
    
    if (type === 'boolean') {
      const isEnabled = setting.setting_value === 'true';
      return (
        <div className="flex items-center space-x-2">
          <Switch
            checked={isEnabled}
            onCheckedChange={(checked) => handleSaveSetting(setting, checked.toString())}
          />
          <Badge variant={isEnabled ? 'default' : 'secondary'}>
            {isEnabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
          </Badge>
        </div>
      );
    }
    
    if (type === 'number') {
      return (
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            value={setting.setting_value}
            onChange={(e) => handleSaveSetting(setting, e.target.value)}
            className="w-24"
          />
          {setting.setting_key.includes('price') && <span className="text-sm text-gray-500">บาท</span>}
        </div>
      );
    }
    
    return (
      <div className="flex items-center space-x-2">
        <Input
          value={setting.setting_value}
          onChange={(e) => handleSaveSetting(setting, e.target.value)}
          className="w-32"
        />
      </div>
    );
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
          <h2 className="text-2xl font-bold text-gray-800">การตั้งค่าระบบ</h2>
          <p className="text-gray-600">จัดการการตั้งค่าระบบและค่าคงที่ต่างๆ</p>
        </div>
      </div>

      <div className="grid gap-4">
        {settings.map((setting) => (
          <Card key={setting.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-[#BFA14A] rounded-full flex items-center justify-center text-white">
                    {getSettingIcon(setting.setting_key)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-lg">{setting.setting_key}</h3>
                      <Badge variant="outline" className="text-xs">
                        {getSettingType(setting.setting_key)}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm">{setting.description}</p>
                    <div className="text-xs text-gray-500">
                      อัปเดตล่าสุด: {new Date(setting.updated_at).toLocaleString('th-TH')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {renderSettingValue(setting)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(setting)}
                  >
                    <Settings className="h-4 w-4" />
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
            <DialogTitle>แก้ไขการตั้งค่า</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSetting} className="space-y-4">
            <div>
              <Label htmlFor="setting-key">ชื่อการตั้งค่า</Label>
              <Input
                id="setting-key"
                value={formData.setting_key}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="setting-value">ค่า</Label>
              <Input
                id="setting-value"
                value={formData.setting_value}
                onChange={(e) => setFormData({ ...formData, setting_value: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">คำอธิบาย</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SystemSettingsTab; 