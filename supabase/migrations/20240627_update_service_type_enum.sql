-- ลบ constraint เดิม (ถ้ามี)
ALTER TABLE queues DROP CONSTRAINT IF EXISTS queues_service_type_check;

-- สร้าง ENUM ใหม่ถ้ายังไม่มี
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_type_enum') THEN
    CREATE TYPE service_type_enum AS ENUM ('Walk-in', 'Booking');
  END IF;
END$$;

-- เปลี่ยนคอลัมน์ service_type ให้ใช้ ENUM ใหม่
ALTER TABLE queues
  ALTER COLUMN service_type TYPE service_type_enum
  USING service_type::text::service_type_enum; 