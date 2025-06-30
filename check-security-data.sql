-- ตรวจสอบข้อมูล Security Phase 5
-- รันคำสั่งนี้ใน Supabase SQL Editor เพื่อดูข้อมูล

-- 1. ตรวจสอบ login_attempts
SELECT 
  'login_attempts' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN success = false THEN 1 END) as failed_attempts,
  COUNT(CASE WHEN success = true THEN 1 END) as successful_attempts,
  MAX(created_at) as latest_record
FROM public.login_attempts;

-- 2. ดู login attempts ล่าสุด 10 รายการ
SELECT 
  username,
  ip_address,
  success,
  created_at,
  user_agent
FROM public.login_attempts 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. ตรวจสอบ security_alerts
SELECT 
  'security_alerts' as table_name,
  COUNT(*) as total_alerts,
  COUNT(CASE WHEN resolved = false THEN 1 END) as active_alerts,
  COUNT(CASE WHEN resolved = true THEN 1 END) as resolved_alerts
FROM public.security_alerts;

-- 4. ดู security alerts ล่าสุด
SELECT 
  type,
  severity,
  message,
  resolved,
  created_at
FROM public.security_alerts 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. ตรวจสอบ system_settings
SELECT 
  setting_key,
  setting_value,
  category,
  settings
FROM public.system_settings 
WHERE category = 'security';

-- 6. ตรวจสอบ admin_users
SELECT 
  username,
  role,
  is_active,
  last_login
FROM public.admin_users 
ORDER BY created_at DESC;

-- 7. นับ failed attempts ตาม username
SELECT 
  username,
  COUNT(*) as failed_count,
  MAX(created_at) as last_attempt
FROM public.login_attempts 
WHERE success = false 
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY username 
ORDER BY failed_count DESC; 