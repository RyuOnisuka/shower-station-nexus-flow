import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Droplets, Users, Shield, Clock } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: '#FAF6EF' }}
    >
      <div className="flex flex-col items-center mb-8">
        <img
          src="/shower-logo.svg"
          alt="Shower Station Logo"
          className="w-20 h-20 mb-4 drop-shadow-lg"
        />
        <h1 className="text-4xl font-bold mb-2" style={{ color: '#BFA14A' }}>
          Shower Station
        </h1>
        <p className="text-lg text-gray-700 mb-2 text-center">
          ระบบจองและจัดการคิวห้องอาบน้ำออนไลน์ ผ่าน LINE OA สะดวก รวดเร็ว และปลอดภัย
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 w-full max-w-5xl">
        <div className="rounded-2xl shadow-md border border-[#F3E9D3] bg-white p-6 flex flex-col items-center">
          <span className="mb-2">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#FAF6EF"/><path d="M12 7v6l4 2" stroke="#BFA14A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
          <h2 className="font-semibold text-lg mb-1" style={{ color: '#BFA14A' }}>ห้องอาบน้ำสะอาด</h2>
          <p className="text-gray-700 text-center text-sm">ห้องอาบน้ำมาตรฐาน พร้อมอุปกรณ์ครบครัน</p>
        </div>
        <div className="rounded-2xl shadow-md border border-[#F3E9D3] bg-white p-6 flex flex-col items-center">
          <span className="mb-2">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#FAF6EF"/><path d="M8 12h8M12 8v8" stroke="#BFA14A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
          <h2 className="font-semibold text-lg mb-1" style={{ color: '#BFA14A' }}>จองคิวง่าย</h2>
          <p className="text-gray-700 text-center text-sm">จองผ่าน LINE OA ไม่ต้องรอคิวนาน</p>
        </div>
        <div className="rounded-2xl shadow-md border border-[#F3E9D3] bg-white p-6 flex flex-col items-center">
          <span className="mb-2">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#FAF6EF"/><path d="M12 8v4l3 3" stroke="#BFA14A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
          <h2 className="font-semibold text-lg mb-1" style={{ color: '#BFA14A' }}>ปลอดภัย</h2>
          <p className="text-gray-700 text-center text-sm">ระบบรักษาความปลอดภัยข้อมูลส่วนบุคคล</p>
        </div>
        <div className="rounded-2xl shadow-md border border-[#F3E9D3] bg-white p-6 flex flex-col items-center">
          <span className="mb-2">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#FAF6EF"/><path d="M12 6v6l4 2" stroke="#BFA14A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
          <h2 className="font-semibold text-lg mb-1" style={{ color: '#BFA14A' }}>เปิด 24 ชั่วโมง</h2>
          <p className="text-gray-700 text-center text-sm">บริการตลอด 24 ชั่วโมง ทุกวัน</p>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <a
          href="/login"
          className="px-8 py-3 rounded-full font-semibold text-white shadow-md"
          style={{ background: '#BFA14A' }}
        >
          เริ่มใช้บริการ
        </a>
        <a
          href="/admin"
          className="px-8 py-3 rounded-full font-semibold border border-[#BFA14A] text-[#BFA14A] bg-white shadow-md"
        >
          เข้าสู่ระบบแอดมิน
        </a>
      </div>
      <div className="mt-2">
        <div className="flex items-center justify-center gap-2 bg-[#F3E9D3] rounded-lg px-4 py-2">
          <span role="img" aria-label="info" className="text-[#BFA14A]">💡</span>
          <span className="text-sm text-[#2D2A1F]">
            <b>Demo Mode:</b> ในการใช้งานจริง ระบบจะเชื่อมต่อกับ LINE OA และ Supabase
          </span>
        </div>
      </div>
    </div>
  );
};

export default Index;
