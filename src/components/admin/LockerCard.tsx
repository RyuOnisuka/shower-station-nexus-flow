
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getLockerStatusColor, getLockerStatusBadge, getLockerStatusText } from '@/utils/statusUtils';
import type { Database } from '@/integrations/supabase/types';

type Locker = Database['public']['Tables']['lockers']['Row'];

interface LockerCardProps {
  locker: Locker;
}

export const LockerCard = ({ locker }: LockerCardProps) => {
  return (
    <Card className={`p-4 text-center ${getLockerStatusColor(locker.status || 'available')}`}>
      <div className="font-bold text-lg">{locker.locker_number}</div>
      <div className="text-sm text-gray-600">{locker.location}</div>
      <Badge className={`mt-2 ${getLockerStatusBadge(locker.status || 'available')}`}>
        {getLockerStatusText(locker.status || 'available')}
      </Badge>
    </Card>
  );
};
