
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LockerCard } from './LockerCard';
import type { Database } from '@/integrations/supabase/types';

type Locker = Database['public']['Tables']['lockers']['Row'];

interface LockerManagementTabProps {
  lockers: Locker[];
}

export const LockerManagementTab = ({ lockers }: LockerManagementTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>สถานะตู้ล็อกเกอร์</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {lockers?.map((locker) => (
            <LockerCard key={locker.id} locker={locker} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
