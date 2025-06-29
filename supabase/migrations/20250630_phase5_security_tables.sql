-- Phase 5: Security Tables Migration
-- สร้างตารางสำหรับระบบความปลอดภัยขั้นสูง

-- ตาราง login_attempts สำหรับบันทึกการพยายามเข้าสู่ระบบ
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    success BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ตาราง security_alerts สำหรับแจ้งเตือนความปลอดภัย
CREATE TABLE IF NOT EXISTS public.security_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('failed_login', 'suspicious_activity', 'unauthorized_access', 'data_breach')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES public.admin_users(id)
);

-- อัปเดตตาราง system_settings เพื่อรองรับ security settings
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS settings JSONB;

-- สร้าง index สำหรับประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_login_attempts_username_ip ON public.login_attempts(username, ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON public.login_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_security_alerts_type_severity ON public.security_alerts(type, severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_resolved ON public.security_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings(category);

-- RLS Policies
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

-- Policies สำหรับ login_attempts
CREATE POLICY "Admin can view all login attempts" ON public.login_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.id = auth.uid()::text
            AND au.is_active = true
        )
    );

CREATE POLICY "System can insert login attempts" ON public.login_attempts
    FOR INSERT WITH CHECK (true);

-- Policies สำหรับ security_alerts
CREATE POLICY "Admin can view all security alerts" ON public.security_alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.id = auth.uid()::text
            AND au.is_active = true
        )
    );

CREATE POLICY "Admin can update security alerts" ON public.security_alerts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.id = auth.uid()::text
            AND au.is_active = true
        )
    );

CREATE POLICY "System can insert security alerts" ON public.security_alerts
    FOR INSERT WITH CHECK (true);

-- เพิ่มข้อมูลเริ่มต้นสำหรับ security settings
INSERT INTO public.system_settings (setting_key, setting_value, description, category, settings)
VALUES (
    'security_settings',
    'default',
    'Security configuration settings',
    'security',
    '{
        "max_login_attempts": 5,
        "lockout_duration": 30,
        "session_timeout": 480,
        "require_2fa": false,
        "password_policy": {
            "min_length": 8,
            "require_uppercase": true,
            "require_lowercase": true,
            "require_numbers": true,
            "require_special": true
        },
        "ip_whitelist": [],
        "activity_monitoring": true
    }'
) ON CONFLICT (setting_key) DO NOTHING; 