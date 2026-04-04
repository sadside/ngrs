import { TRIP_STATUS_LABELS } from '@/shared/config/constants';

export function getTripStatusLabel(status: string): string {
  return TRIP_STATUS_LABELS[status] ?? status;
}
