import { escapeHtml, formatDateTime } from './utils';

// Label map duplicated from apps/web/src/shared/config/constants.ts — backend has no shared UI constants.
// Keep in sync if the frontend map changes.
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

export interface TripForTemplate {
  id: string;
  status: string;
  driver: { fullName: string };
  vehicle: { brand: string; licensePlate: string };
  cargo: { name: string };
  route: {
    senderContractor: { name: string };
    receiverContractor: { name: string };
  };
}

export function renderTripStatusMessage(trip: TripForTemplate): string {
  const emoji = STATUS_EMOJI[trip.status] ?? '🚚';
  const statusLabel = TRIP_STATUS_LABELS[trip.status] ?? trip.status;

  return [
    `${emoji} <b>Изменение статуса рейса</b>`,
    ``,
    `<b>Водитель:</b> ${escapeHtml(trip.driver.fullName)}`,
    `<b>Маршрут:</b> ${escapeHtml(trip.route.senderContractor.name)} → ${escapeHtml(trip.route.receiverContractor.name)}`,
    `<b>ТС:</b> ${escapeHtml(trip.vehicle.brand)} ${escapeHtml(trip.vehicle.licensePlate)}`,
    `<b>Груз:</b> ${escapeHtml(trip.cargo.name)}`,
    `<b>Статус:</b> ${statusLabel}`,
    `<b>Время:</b> ${formatDateTime(new Date())}`,
  ].join('\n');
}
