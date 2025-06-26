
-- เพิ่มคอลัมน์ booking_time ในตาราง queues
ALTER TABLE public.queues 
ADD COLUMN booking_time timestamp with time zone;

-- เพิ่ม index สำหรับ booking_time เพื่อประสิทธิภาพ
CREATE INDEX idx_queues_booking_time ON public.queues(booking_time);
