import { Badge } from '@/shared/ui/badge';
import { getTripStatusLabel, getTripStatusColor } from './lib';

export function TripStatusBadge({ status }: { status: string }) {
  return <Badge className={getTripStatusColor(status)}>{getTripStatusLabel(status)}</Badge>;
}
