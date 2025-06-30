-- Setup Test Data for Security Phase 5 Testing
-- รันคำสั่งนี้ใน Supabase SQL Editor

-- 1. สร้าง admin users สำหรับทดสอบ
INSERT INTO public.admin_users (username, email, password_hash, role, is_active) VALUES
('test_staff', 'staff@test.com', '$2a$10$dummy.hash.for.test_staff', 'staff', true),
('test_admin', 'admin@test.com', '$2a$10$dummy.hash.for.test_admin', 'admin', true),
('test_super', 'super@test.com', '$2a$10$dummy.hash.for.test_super', 'super_admin', true)
ON CONFLICT (username) DO NOTHING;

-- 2. สร้าง login attempts สำหรับทดสอบ
INSERT INTO public.login_attempts (username, ip_address, user_agent, success) VALUES
('unknown_user', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', false),
('unknown_user', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', false),
('unknown_user', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', false),
('test_staff', '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', true),
('test_admin', '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', true),
('suspicious_user', '10.0.0.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', false),
('suspicious_user', '10.0.0.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', false),
('suspicious_user', '10.0.0.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', false),
('suspicious_user', '10.0.0.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', false),
('suspicious_user', '10.0.0.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', false);

-- 3. สร้าง security alerts สำหรับทดสอบ
INSERT INTO public.security_alerts (type, severity, message, details) VALUES
('failed_login', 'medium', 'Multiple failed login attempts detected for user: suspicious_user', 
 '{"username": "suspicious_user", "ip_address": "10.0.0.50", "attempts": 5}'),
('suspicious_activity', 'high', 'Unusual login pattern detected from IP: 192.168.1.100', 
 '{"ip_address": "192.168.1.100", "pattern": "rapid_failed_attempts"}'),
('unauthorized_access', 'critical', 'Attempted access to admin panel from unauthorized IP', 
 '{"ip_address": "203.0.113.1", "endpoint": "/admin"}'),
('data_breach', 'critical', 'Potential data breach detected in user table', 
 '{"table": "users", "affected_records": 150}');

-- 4. อัปเดต security settings สำหรับทดสอบ
UPDATE public.system_settings 
SET settings = '{
    "max_login_attempts": 5,
    "lockout_duration": 5,
    "session_timeout": 240,
    "require_2fa": false,
    "password_policy": {
        "min_length": 8,
        "require_uppercase": true,
        "require_lowercase": true,
        "require_numbers": true,
        "require_special": true
    },
    "ip_whitelist": ["192.168.1.0/24"],
    "activity_monitoring": true
}'
WHERE setting_key = 'security_settings';

-- 5. สร้าง test users สำหรับทดสอบ user approval
INSERT INTO public.users (phone_number, first_name, last_name, email, gender, user_type, status) VALUES
('0811111111', 'ทดสอบ', 'อนุมัติ1', 'test1@example.com', 'male', 'employee', 'pending'),
('0822222222', 'ทดสอบ', 'อนุมัติ2', 'test2@example.com', 'female', 'dependent', 'pending'),
('0833333333', 'ทดสอบ', 'อนุมัติ3', 'test3@example.com', 'male', 'general', 'pending');

-- 6. ตรวจสอบข้อมูลที่สร้าง
SELECT 'Admin Users' as table_name, count(*) as count FROM public.admin_users
UNION ALL
SELECT 'Login Attempts' as table_name, count(*) as count FROM public.login_attempts
UNION ALL
SELECT 'Security Alerts' as table_name, count(*) as count FROM public.security_alerts
UNION ALL
SELECT 'System Settings' as table_name, count(*) as count FROM public.system_settings WHERE category = 'security'
UNION ALL
SELECT 'Pending Users' as table_name, count(*) as count FROM public.users WHERE status = 'pending'; 