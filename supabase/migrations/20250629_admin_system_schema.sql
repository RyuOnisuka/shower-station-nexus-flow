-- Migration: Admin System Schema
-- Date: 2025-06-29
-- Description: เพิ่มตารางสำหรับระบบ Admin Panel

-- ตาราง Admin Users
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'admin', 'staff')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ตาราง Admin Sessions
CREATE TABLE public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES public.admin_users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ตาราง Locker History
CREATE TABLE public.locker_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locker_id UUID REFERENCES public.lockers(id) ON DELETE CASCADE,
  queue_id UUID REFERENCES public.queues(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN ('assigned', 'released', 'maintenance_start', 'maintenance_end', 'reserved', 'out_of_service')),
  admin_user_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ตาราง System Settings
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  updated_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ตาราง Audit Logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(50),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- เพิ่มคอลัมน์ใหม่ในตาราง lockers
ALTER TABLE public.lockers 
ADD COLUMN IF NOT EXISTS maintenance_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS maintenance_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS maintenance_notes TEXT,
ADD COLUMN IF NOT EXISTS reserved_until TIMESTAMP WITH TIME ZONE;

-- สร้าง Indexes สำหรับประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON public.admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON public.admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON public.admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_locker_history_locker_id ON public.locker_history(locker_id);
CREATE INDEX IF NOT EXISTS idx_locker_history_action ON public.locker_history(action);
CREATE INDEX IF NOT EXISTS idx_locker_history_created_at ON public.locker_history(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_user_id ON public.audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- สร้าง RLS Policies
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locker_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy สำหรับ admin_users (Super Admin เท่านั้นที่จัดการได้)
DROP POLICY IF EXISTS "Super admin can manage admin users" ON public.admin_users;

CREATE POLICY "Allow all access to admin_users" ON public.admin_users
  FOR ALL USING (true);

-- Policy สำหรับ admin_sessions
CREATE POLICY "Admin users can manage their own sessions" ON public.admin_sessions
  FOR ALL USING (
    admin_user_id = auth.uid()
  );

-- Policy สำหรับ locker_history (Admin และ Staff ดูได้)
CREATE POLICY "Admin and staff can view locker history" ON public.locker_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.id = auth.uid() AND au.role IN ('super_admin', 'admin', 'staff')
    )
  );

CREATE POLICY "Admin and staff can insert locker history" ON public.locker_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.id = auth.uid() AND au.role IN ('super_admin', 'admin', 'staff')
    )
  );

-- Policy สำหรับ system_settings (Super Admin เท่านั้น)
CREATE POLICY "Super admin can manage system settings" ON public.system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.id = auth.uid() AND au.role = 'super_admin'
    )
  );

-- Policy สำหรับ audit_logs (Super Admin และ Admin ดูได้)
CREATE POLICY "Super admin and admin can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.id = auth.uid() AND au.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- เพิ่มข้อมูลเริ่มต้น
INSERT INTO public.admin_users (username, email, password_hash, role) VALUES
('superadmin', 'superadmin@showerstation.com', '$2a$10$dummy.hash.for.superadmin', 'super_admin'),
('admin1', 'admin1@showerstation.com', '$2a$10$dummy.hash.for.admin1', 'admin'),
('staff1', 'staff1@showerstation.com', '$2a$10$dummy.hash.for.staff1', 'staff');

-- เพิ่ม System Settings เริ่มต้น
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
('business_hours_start', '07:00', 'เวลาทำการเริ่มต้น'),
('business_hours_end', '22:30', 'เวลาทำการสิ้นสุด'),
('price_general', '100', 'ราคาสำหรับสมาชิกทั่วไป'),
('price_employee', '50', 'ราคาสำหรับพนักงาน'),
('price_dependent', '70', 'ราคาสำหรับผู้อยู่ในอุปการะ'),
('max_queue_per_day', '999', 'จำนวนคิวสูงสุดต่อวัน'),
('auto_assign_locker', 'true', 'เปิดใช้งานการมอบหมายล็อกเกอร์อัตโนมัติ'),
('maintenance_notification', 'true', 'แจ้งเตือนเมื่อล็อกเกอร์เข้าซ่อมบำรุง');

-- เพิ่มข้อมูลจำลองสำหรับ Locker History
INSERT INTO public.locker_history (locker_id, action, notes) VALUES
((SELECT id FROM public.lockers WHERE locker_number = 'ML01' LIMIT 1), 'maintenance_start', 'เริ่มซ่อมบำรุงตามกำหนด'),
((SELECT id FROM public.lockers WHERE locker_number = 'FL01' LIMIT 1), 'reserved', 'จองไว้สำหรับกิจกรรมพิเศษ'); 