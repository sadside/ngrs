import { escapeHtml, formatDateTime } from './utils';

const TRIP_STATUS_LABELS: Record<string, string> = {
  ASSIGNED: 'Назначен',
  EN_ROUTE_TO_LOADING: 'Едет на погрузку',
  LOADING: 'На погрузке',
  EN_ROUTE_TO_UNLOADING: 'Едет на выгрузку',
  UNLOADING: 'На выгрузке',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
};

const STATUS_EMOJI: Record<string, string> = {
  ASSIGNED: '📋',
  EN_ROUTE_TO_LOADING: '🚚',
  LOADING: '⚙️',
  EN_ROUTE_TO_UNLOADING: '🚛',
  UNLOADING: '📦',
  COMPLETED: '✅',
  CANCELLED: '❌',
};

export interface TripListItem {
  id: string;
  status: string;
  assignedAt: Date;
  driver: { fullName: string };
  vehicle: { licensePlate: string };
  route: {
    senderContractor: { name: string };
    receiverContractor: { name: string };
  };
}

export function renderTripsList(trips: TripListItem[]): string {
  if (trips.length === 0) return 'Нет рейсов.';

  const lines = [`🚚 <b>Последние ${trips.length} рейсов</b>`, ''];
  trips.forEach((trip, i) => {
    const emoji = STATUS_EMOJI[trip.status] ?? '🚚';
    const status = TRIP_STATUS_LABELS[trip.status] ?? trip.status;
    lines.push(
      `${i + 1}. ${emoji} ${status} — ${escapeHtml(trip.driver.fullName)}`,
      `   ${escapeHtml(trip.route.senderContractor.name)} → ${escapeHtml(trip.route.receiverContractor.name)}`,
      `   ТС: ${escapeHtml(trip.vehicle.licensePlate)} · ${formatDateTime(trip.assignedAt)}`,
      '',
    );
  });
  return lines.join('\n').trimEnd();
}
