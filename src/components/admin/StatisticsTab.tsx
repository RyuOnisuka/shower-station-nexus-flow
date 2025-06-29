import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from './StatsCard';
import { ChartContainer } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { Database } from '@/integrations/supabase/types';

type DailyStat = Database['public']['Tables']['daily_stats']['Row'];

interface StatisticsTabProps {
  dailyStats: DailyStat[];
}

export const StatisticsTab = ({ dailyStats }: StatisticsTabProps) => {
  const todayStats = dailyStats?.[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatsCard
          title="คิววันนี้"
          value={todayStats?.total_queues || 0}
          className="text-blue-600"
        />
        <StatsCard
          title="เสร็จสิ้น"
          value={todayStats?.completed_queues || 0}
          className="text-green-600"
        />
        <StatsCard
          title="ยกเลิก"
          value={todayStats?.cancelled_queues || 0}
          className="text-red-600"
        />
        <StatsCard
          title="เปอร์เซ็นต์สำเร็จ"
          value={todayStats && todayStats.total_queues ? `${Math.round(100 * (todayStats.completed_queues || 0) / todayStats.total_queues)}%` : '-'}
          className="text-green-700"
        />
        <StatsCard
          title="รายได้วันนี้"
          value={`฿${todayStats?.total_revenue || 0}`}
          className="text-purple-600"
        />
        <StatsCard
          title="ช่วงเวลาเร็ววันนี้"
          value={`${todayStats?.peak_hour || '-'}:00`}
          className="text-orange-600"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>สถิติ 7 วันย้อนหลัง</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="font-semibold mb-2">กราฟรายได้รวม 7 วัน</div>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dailyStats?.slice(0, 7).reverse() || []}>
                  <XAxis dataKey={stat => new Date(stat.date).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' })} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={v => `฿${v}`} />
                  <Bar dataKey="total_revenue" fill="#BFA14A" name="รายได้ (บาท)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-3">
            {dailyStats?.slice(0, 7).map((stat) => (
              <div key={stat.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex space-x-4">
                  <span className="font-medium">
                    {new Date(stat.date).toLocaleDateString('th-TH')}
                  </span>
                  <span>คิว: {stat.total_queues}</span>
                  <span>เสร็จ: {stat.completed_queues}</span>
                </div>
                <div className="font-bold text-green-600">
                  ฿{stat.total_revenue}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
