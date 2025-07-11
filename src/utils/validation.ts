import { z } from 'zod';

// Schema สำหรับการตรวจสอบข้อมูลผู้ใช้
export const userSchema = z.object({
  phone_number: z
    .string()
    .min(10, 'หมายเลขโทรศัพท์ต้องมีอย่างน้อย 10 หลัก')
    .max(15, 'หมายเลขโทรศัพท์ต้องไม่เกิน 15 หลัก')
    .regex(/^[0-9+\-\s()]+$/, 'หมายเลขโทรศัพท์ไม่ถูกต้อง'),
  first_name: z
    .string()
    .min(2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร')
    .max(50, 'ชื่อต้องไม่เกิน 50 ตัวอักษร')
    .regex(/^[ก-๙a-zA-Z\s]+$/, 'ชื่อต้องเป็นตัวอักษรเท่านั้น'),
  last_name: z
    .string()
    .min(2, 'นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร')
    .max(50, 'นามสกุลต้องไม่เกิน 50 ตัวอักษร')
    .regex(/^[ก-๙a-zA-Z\s]+$/, 'นามสกุลต้องเป็นตัวอักษรเท่านั้น'),
  email: z
    .string()
    .email('อีเมลไม่ถูกต้อง')
    .optional(),
  gender: z
    .enum(['male', 'female', 'unspecified'], {
      errorMap: () => ({ message: 'กรุณาเลือกเพศ' })
    }),
  restroom_pref: z
    .enum(['male', 'female'], {
      errorMap: () => ({ message: 'กรุณาเลือกห้องน้ำที่ต้องการ' })
    }),
  user_type: z
    .enum(['general', 'employee', 'dependent'], {
      errorMap: () => ({ message: 'กรุณาเลือกประเภทผู้ใช้' })
    })
});

// Schema สำหรับการตรวจสอบข้อมูลคิว
export const queueSchema = z.object({
  service_type: z
    .enum(['shower', 'locker'], {
      errorMap: () => ({ message: 'กรุณาเลือกประเภทบริการ' })
    }),
  booking_time: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'รูปแบบเวลาไม่ถูกต้อง (HH:MM)')
    .optional(),
  user_id: z.string().uuid('ID ผู้ใช้ไม่ถูกต้อง'),
  price: z.number().min(0, 'ราคาต้องไม่ติดลบ')
});

// Schema สำหรับการตรวจสอบข้อมูลการชำระเงิน
export const paymentSchema = z.object({
  queue_id: z.string().uuid('ID คิวไม่ถูกต้อง'),
  amount: z.number().min(0, 'จำนวนเงินต้องไม่ติดลบ'),
  payment_method: z
    .enum(['cash', 'transfer', 'qr'], {
      errorMap: () => ({ message: 'กรุณาเลือกวิธีการชำระเงิน' })
    }),
  slip_image: z
    .string()
    .url('URL รูปภาพไม่ถูกต้อง')
    .optional()
});

// Schema สำหรับการตรวจสอบข้อมูล Admin
export const adminUserSchema = z.object({
  username: z
    .string()
    .min(3, 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร')
    .max(50, 'ชื่อผู้ใช้ต้องไม่เกิน 50 ตัวอักษร')
    .regex(/^[a-zA-Z0-9_]+$/, 'ชื่อผู้ใช้ต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข และ _ เท่านั้น'),
  email: z
    .string()
    .email('อีเมลไม่ถูกต้อง'),
  password: z
    .string()
    .min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'รหัสผ่านต้องมีตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ ตัวเลข และอักขระพิเศษ'),
  role: z
    .enum(['super_admin', 'admin', 'staff'], {
      errorMap: () => ({ message: 'กรุณาเลือกบทบาท' })
    })
});

// Schema สำหรับการตรวจสอบข้อมูลล็อกเกอร์
export const lockerSchema = z.object({
  locker_number: z
    .string()
    .regex(/^[A-Z]{1,2}L\d{2}$/, 'หมายเลขล็อกเกอร์ไม่ถูกต้อง (เช่น ML01, FL02)'),
  status: z
    .enum(['available', 'occupied', 'maintenance', 'reserved'], {
      errorMap: () => ({ message: 'สถานะไม่ถูกต้อง' })
    }),
  gender: z
    .enum(['male', 'female'], {
      errorMap: () => ({ message: 'กรุณาเลือกเพศ' })
    })
});

// Schema สำหรับการตรวจสอบข้อมูลระบบ
export const systemSettingsSchema = z.object({
  business_hours_start: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'รูปแบบเวลาไม่ถูกต้อง'),
  business_hours_end: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'รูปแบบเวลาไม่ถูกต้อง'),
  price_general: z.number().min(0, 'ราคาต้องไม่ติดลบ'),
  price_employee: z.number().min(0, 'ราคาต้องไม่ติดลบ'),
  price_dependent: z.number().min(0, 'ราคาต้องไม่ติดลบ'),
  max_queue_per_day: z.number().min(1, 'จำนวนคิวสูงสุดต้องมากกว่า 0'),
  auto_assign_locker: z.boolean(),
  maintenance_notification: z.boolean()
});

// ฟังก์ชันสำหรับตรวจสอบหมายเลขโทรศัพท์ไทย
export const validateThaiPhoneNumber = (phone: string): boolean => {
  const thaiPhoneRegex = /^(\+66|66|0)[0-9]{8,9}$/;
  return thaiPhoneRegex.test(phone.replace(/\s+/g, ''));
};

// ฟังก์ชันสำหรับตรวจสอบรหัสผ่าน
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว');
  }
  
  if (!/\d/.test(password)) {
    errors.push('รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// ฟังก์ชันสำหรับตรวจสอบอีเมล
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ฟังก์ชันสำหรับตรวจสอบ URL
export const validateURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// ฟังก์ชันสำหรับตรวจสอบไฟล์รูปภาพ
export const validateImageFile = (file: File): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (file.size > maxSize) {
    errors.push('ขนาดไฟล์ต้องไม่เกิน 5MB');
  }
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, GIF, WebP)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// ฟังก์ชันสำหรับตรวจสอบเวลาทำการ
export const validateBusinessHours = (start: string, end: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  const startTime = new Date(`2000-01-01T${start}`);
  const endTime = new Date(`2000-01-01T${end}`);
  
  if (startTime >= endTime) {
    errors.push('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// ฟังก์ชันสำหรับ sanitize input
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // ป้องกัน XSS
    .replace(/\s+/g, ' '); // ลบช่องว่างซ้ำ
};

// ฟังก์ชันสำหรับตรวจสอบความปลอดภัยของ input
export const isInputSafe = (input: string): boolean => {
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(input));
};

// Type exports
export type UserFormData = z.infer<typeof userSchema>;
export type QueueFormData = z.infer<typeof queueSchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;
export type AdminUserFormData = z.infer<typeof adminUserSchema>;
export type LockerFormData = z.infer<typeof lockerSchema>;
export type SystemSettingsFormData = z.infer<typeof systemSettingsSchema>; 