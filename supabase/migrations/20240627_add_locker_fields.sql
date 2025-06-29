-- เพิ่มฟิลด์ user_id, occupied_at, released_at ให้กับตาราง lockers
ALTER TABLE lockers
  ADD COLUMN user_id uuid NULL,
  ADD COLUMN occupied_at timestamptz NULL,
  ADD COLUMN released_at timestamptz NULL;

-- เพิ่ม foreign key constraint สำหรับ user_id (ถ้ามีตาราง users)
ALTER TABLE lockers
  ADD CONSTRAINT lockers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

-- สมมติคุณทราบ user_id ของสมาชิกชายและหญิงจากข้อ 1 (คัดลอก uuid ที่ได้มา)
-- ตัวอย่าง:
-- ชาย: '11111111-1111-1111-1111-111111111111'
-- หญิง: '22222222-2222-2222-2222-222222222222'

insert into queues (id, user_id, queue_number, price, status, service_type)
values (gen_random_uuid(), 'USER_ID_MALE', 'Q001', 50, 'waiting', 'shower');

insert into queues (id, user_id, queue_number, price, status, service_type)
values (gen_random_uuid(), 'USER_ID_FEMALE', 'Q002', 50, 'waiting', 'shower');

-- สมาชิกเพศชาย
insert into users (id, first_name, last_name, gender, phone_number, status)
values (gen_random_uuid(), 'สมชาย', 'ทดสอบ', 'male', '0800000001', 'active');

-- สมาชิกเพศหญิง
insert into users (id, first_name, last_name, gender, phone_number, status)
values (gen_random_uuid(), 'สมหญิง', 'ทดสอบ', 'female', '0800000002', 'active');

-- สมมติคุณทราบ queue_id จากข้อ 2 (คัดลอก uuid ที่ได้มา)

insert into payments (id, queue_id, amount, status)
values (gen_random_uuid(), 'QUEUE_ID_MALE', 50, 'pending');

insert into payments (id, queue_id, amount, status)
values (gen_random_uuid(), 'QUEUE_ID_FEMALE', 50, 'pending');

insert into lockers (id, locker_number, status)
values (gen_random_uuid(), 'ML01', 'available'),
       (gen_random_uuid(), 'ML02', 'available'),
       (gen_random_uuid(), 'FL01', 'available'),
       (gen_random_uuid(), 'FL02', 'available'); 