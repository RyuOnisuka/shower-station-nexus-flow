
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from './StatsCard';
import type { Database } from '@/integrations/supabase/types';

type DailyStat = Database['public']['Tables']['daily_stats']['Row'];

interface StatisticsTabProps {
  dailyStats: DailyStat[];
}

export const StatisticsTab = ({ dailyStats }: StatisticsTabProps) => {
  const todayStats = dailyStats?.[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
