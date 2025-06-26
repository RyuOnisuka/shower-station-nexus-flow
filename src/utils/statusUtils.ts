
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'waiting': return 'bg-yellow-500';
    case 'called': return 'bg-blue-500';
    case 'processing': return 'bg-green-500';
    case 'completed': return 'bg-gray-500';
    case 'cancelled': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

export const getStatusText = (status: string) => {
  switch (status) {
    case 'waiting': return 'รอคิว';
    case 'called': return 'เรียกแล้ว';
    case 'processing': return 'ใช้งาน';
    case 'completed': return 'เสร็จสิ้น';
    case 'cancelled': return 'ยกเลิก';
    default: return status;
  }
};

export const getLockerStatusColor = (status: string) => {
  return status === 'available' ? 'bg-green-50 border-green-200' :
         status === 'occupied' ? 'bg-red-50 border-red-200' :
         'bg-yellow-50 border-yellow-200';
};

export const getLockerStatusBadge = (status: string) => {
  return status === 'available' ? 'bg-green-500' :
         status === 'occupied' ? 'bg-red-500' :
         'bg-yellow-500';
};

export const getLockerStatusText = (status: string) => {
  return status === 'available' ? 'ว่าง' :
         status === 'occupied' ? 'ใช้งาน' : 'ซ่อม';
};
