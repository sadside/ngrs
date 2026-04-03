import { TRIP_STATUS_LABELS, TRIP_STATUS_COLORS } from '@/shared/config/constants';

export function getTripStatusLabel(status: string): string {
  return TRIP_STATUS_LABELS[status] ?? status;
}

export function getTripStatusColor(status: string): string {
  return TRIP_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800';
}
