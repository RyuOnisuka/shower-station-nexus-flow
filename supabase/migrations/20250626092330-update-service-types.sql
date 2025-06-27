-- อัปเดต constraint สำหรับ service_type ให้รองรับ shower และ toilet
ALTER TABLE public.queues 
DROP CONSTRAINT IF EXISTS queues_service_type_check;

ALTER TABLE public.queues 
ADD CONSTRAINT queues_service_type_check 
CHECK (service_type IN ('shower', 'toilet'));

-- อัปเดตข้อมูลเก่าที่เป็น 'shower' ให้เป็น 'shower' (ไม่เปลี่ยนแปลง)
-- และข้อมูลที่เป็น 'walkin' ให้เป็น 'shower'
UPDATE public.queues 
SET service_type = 'shower' 
WHERE service_type = 'walkin' OR service_type IS NULL;

-- อัปเดตข้อมูลที่เป็น 'booking' ให้เป็น 'shower' (เพราะ booking เป็นการจองเวลา ไม่ใช่ประเภทบริการ)
UPDATE public.queues 
SET service_type = 'shower' 
WHERE service_type = 'booking'; 