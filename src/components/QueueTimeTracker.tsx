
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';

interface QueueTimeTrackerProps {
  startedAt: string | null;
  status: string;
}

export const QueueTimeTracker = ({ startedAt, status }: QueueTimeTrackerProps) => {
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [isOverTime, setIsOverTime] = useState(false);

  useEffect(() => {
    if (!startedAt || status !== 'processing') {
      return;
    }

    const interval = setInterval(() => {
      const start = new Date(startedAt);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
      
      setTimeElapsed(diffInMinutes);
      setIsOverTime(diffInMinutes >= 180); // 3 hours = 180 minutes
    }, 60000); // Update every minute

    // Initial calculation
    const start = new Date(startedAt);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
    setTimeElapsed(diffInMinutes);
    setIsOverTime(diffInMinutes >= 180);

    return () => clearInterval(interval);
  }, [startedAt, status]);

  if (!startedAt || status !== 'processing') {
    return null;
  }

  const hours = Math.floor(timeElapsed / 60);
  const minutes = timeElapsed % 60;
  const timeDisplay = `${hours}:${minutes.toString().padStart(2, '0')}`;

  return (
    <Badge 
      variant={isOverTime ? "destructive" : "secondary"}
      className="flex items-center gap-1"
    >
      {isOverTime ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
      {timeDisplay}
      {isOverTime && " (เกินเวลา!)"}
    </Badge>
  );
};
