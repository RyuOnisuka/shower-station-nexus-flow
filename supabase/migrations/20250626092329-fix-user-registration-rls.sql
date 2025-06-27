-- เพิ่ม INSERT policy สำหรับ users table เพื่อให้สามารถลงทะเบียนได้
CREATE POLICY "Anyone can insert users" ON public.users
  FOR INSERT WITH CHECK (true); 