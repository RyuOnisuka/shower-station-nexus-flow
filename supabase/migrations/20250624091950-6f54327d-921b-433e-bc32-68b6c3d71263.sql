
-- สร้างตารางสำหรับข้อมูลสมาชิก
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  line_user_id TEXT UNIQUE,
  phone_number TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'unspecified')) DEFAULT 'unspecified',
  restroom_pref TEXT CHECK (restroom_pref IN ('male', 'female')) DEFAULT 'male',
  user_type TEXT CHECK (user_type IN ('general', 'employee', 'dependent')) DEFAULT 'general',
  employee_id TEXT,
  guardian_phone TEXT,
  status TEXT CHECK (status IN ('active', 'pending', 'suspended')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- สร้างตารางสำหรับจัดการคิว
CREATE TABLE public.queues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  service_type TEXT CHECK (service_type IN ('shower', 'toilet')) DEFAULT 'shower',
  status TEXT CHECK (status IN ('waiting', 'called', 'processing', 'completed', 'cancelled')) DEFAULT 'waiting',
  price DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  locker_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  called_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- สร้างตารางสำหรับการชำระเงิน
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_id UUID REFERENCES public.queues(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'transfer', 'qr_code')) DEFAULT 'transfer',
  slip_url TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- สร้างตารางสำหรับ lockers
CREATE TABLE public.lockers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  locker_number TEXT NOT NULL UNIQUE,
  location TEXT NOT NULL,
  status TEXT CHECK (status IN ('available', 'occupied', 'maintenance')) DEFAULT 'available',
  current_queue_id UUID REFERENCES public.queues(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- สร้างตารางสำหรับสถิติรายวัน
CREATE TABLE public.daily_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_queues INTEGER DEFAULT 0,
  completed_queues INTEGER DEFAULT 0,
  cancelled_queues INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  peak_hour INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- เพิ่มข้อมูลจำลอง - สมาชิก
INSERT INTO public.users (line_user_id, phone_number, first_name, last_name, email, gender, user_type) VALUES
('U1234567890', '0812345678', 'สมชาย', 'ใจดี', 'somchai@email.com', 'male', 'general'),
('U1234567891', '0823456789', 'สมหญิง', 'สุขใส', 'somying@email.com', 'female', 'general'),
('U1234567892', '0834567890', 'สมศักดิ์', 'รุ่งเรือง', 'somsak@email.com', 'male', 'employee'),
('U1234567893', '0845678901', 'สมนึก', 'คิดดี', 'somneuk@email.com', 'male', 'general');

-- เพิ่มข้อมูลจำลอง - ตู้ล็อกเกอร์
INSERT INTO public.lockers (locker_number, location, status) VALUES
('A01', 'Floor 1 - Male Section', 'available'),
('A02', 'Floor 1 - Male Section', 'available'),
('A03', 'Floor 1 - Male Section', 'occupied'),
('B01', 'Floor 1 - Female Section', 'available'),
('B02', 'Floor 1 - Female Section', 'available'),
('B03', 'Floor 1 - Female Section', 'available'),
('A11', 'Floor 2 - Male Section', 'available'),
('A12', 'Floor 2 - Male Section', 'maintenance'),
('B11', 'Floor 2 - Female Section', 'available'),
('B12', 'Floor 2 - Female Section', 'available');

-- เพิ่มข้อมูลจำลอง - คิว
INSERT INTO public.queues (queue_number, user_id, status, price, locker_number) VALUES
('MW-001', (SELECT id FROM public.users WHERE phone_number = '0812345678'), 'processing', 50.00, 'A03'),
('MW-002', (SELECT id FROM public.users WHERE phone_number = '0823456789'), 'called', 50.00, NULL),
('MW-003', (SELECT id FROM public.users WHERE phone_number = '0834567890'), 'waiting', 50.00, NULL),
('MW-004', (SELECT id FROM public.users WHERE phone_number = '0845678901'), 'completed', 50.00, NULL);

-- เพิ่มข้อมูลจำลอง - การชำระเงิน
INSERT INTO public.payments (queue_id, amount, status, approved_at) VALUES
((SELECT id FROM public.queues WHERE queue_number = 'MW-001'), 50.00, 'approved', now()),
((SELECT id FROM public.queues WHERE queue_number = 'MW-002'), 50.00, 'pending', NULL),
((SELECT id FROM public.queues WHERE queue_number = 'MW-004'), 50.00, 'approved', now() - interval '2 hours');

-- เพิ่มข้อมูลจำลอง - สถิติรายวัน
INSERT INTO public.daily_stats (date, total_queues, completed_queues, cancelled_queues, total_revenue, peak_hour) VALUES
(CURRENT_DATE, 12, 8, 1, 400.00, 14),
(CURRENT_DATE - interval '1 day', 15, 12, 2, 600.00, 13),
(CURRENT_DATE - interval '2 days', 18, 15, 1, 750.00, 15),
(CURRENT_DATE - interval '3 days', 10, 9, 0, 450.00, 12);

-- อัปเดต locker ที่ถูกใช้งาน
UPDATE public.lockers 
SET current_queue_id = (SELECT id FROM public.queues WHERE queue_number = 'MW-001')
WHERE locker_number = 'A03';

-- สร้าง RLS policies สำหรับความปลอดภัย
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lockers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

-- Policy สำหรับ users (ผู้ใช้ดูข้อมูลตัวเองได้)
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (true);

-- Policy สำหรับ queues (ทุกคนดูได้เพื่อการจัดการคิว)
CREATE POLICY "Anyone can view queues" ON public.queues
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert queues" ON public.queues
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update queues" ON public.queues
  FOR UPDATE USING (true);

-- Policy สำหรับ payments
CREATE POLICY "Anyone can view payments" ON public.payments
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert payments" ON public.payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update payments" ON public.payments
  FOR UPDATE USING (true);

-- Policy สำหรับ lockers
CREATE POLICY "Anyone can view lockers" ON public.lockers
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update lockers" ON public.lockers
  FOR UPDATE USING (true);

-- Policy สำหรับ daily_stats
CREATE POLICY "Anyone can view daily_stats" ON public.daily_stats
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert daily_stats" ON public.daily_stats
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update daily_stats" ON public.daily_stats
  FOR UPDATE USING (true);
