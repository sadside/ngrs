import { Badge } from '@/shared/ui/badge';
import { getTripStatusLabel } from './lib';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  ASSIGNED: 'neutral',
  EN_ROUTE_TO_LOADING: 'info',
  LOADING: 'warning',
  EN_ROUTE_TO_UNLOADING: 'info',
  UNLOADING: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

export function TripStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? 'neutral'}>
      {getTripStatusLabel(status)}
    </Badge>
  );
}
