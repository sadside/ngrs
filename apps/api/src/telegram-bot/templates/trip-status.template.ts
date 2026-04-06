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

export interface TripForTemplate {
  id: string;
  status: string;
  assignedAt?: Date | string;
  driver: { fullName: string };
  vehicle: { brand: string; model: string; licensePlate: string };
  cargo: { name: string };
  route: {
    senderContractor: { name: string };
    receiverContractor: { name: string };
    loadingAddress?: string;
    unloadingAddress?: string;
  };
  waybill?: { ttnNumber: string } | null;
}

export function renderTripStatusMessage(trip: TripForTemplate): string {
  const emoji = STATUS_EMOJI[trip.status] ?? '🚚';
  const statusLabel = TRIP_STATUS_LABELS[trip.status] ?? trip.status;

  const lines = [
    `${emoji} <b>Изменение статуса рейса</b>`,
    `━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `👤 <b>Водитель:</b> ${escapeHtml(trip.driver.fullName)}`,
    `📍 <b>Маршрут:</b> ${escapeHtml(trip.route.senderContractor.name)} → ${escapeHtml(trip.route.receiverContractor.name)}`,
  ];

  if (trip.route.loadingAddress) {
    lines.push(`     📦 ${escapeHtml(trip.route.loadingAddress)}`);
  }
  if (trip.route.unloadingAddress) {
    lines.push(`     🏭 ${escapeHtml(trip.route.unloadingAddress)}`);
  }

  lines.push(
    ``,
    `🚗 <b>ТС:</b> ${escapeHtml(trip.vehicle.brand)} ${escapeHtml(trip.vehicle.model)} · ${escapeHtml(trip.vehicle.licensePlate)}`,
    `📦 <b>Груз:</b> ${escapeHtml(trip.cargo.name)}`,
  );

  if (trip.waybill) {
    lines.push(`📄 <b>ТТН:</b> ${escapeHtml(trip.waybill.ttnNumber)}`);
  }

  lines.push(
    ``,
    `━━━━━━━━━━━━━━━━━━━━━`,
    `<b>Статус:</b> ${emoji} ${statusLabel}`,
    `🕐 ${formatDateTime(new Date())}`,
  );

  return lines.join('\n');
}
