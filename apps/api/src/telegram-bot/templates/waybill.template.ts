import { escapeHtml, formatDateTime } from './utils';

export interface WaybillForTemplate {
  id: string;
  ttnNumber: string;
  driverFullName: string;
  weight: unknown;
  loadWeight: unknown;
  submittedAt: Date;
  trip: {
    driver?: { fullName: string };
    vehicle?: { brand: string; model: string; licensePlate: string };
    cargo?: { name: string };
    route: {
      senderContractor: { name: string };
      receiverContractor: { name: string };
    };
  };
}

export function renderWaybillMessage(waybill: WaybillForTemplate): string {
  const lines = [
    `📄 <b>Новая накладная</b>`,
    `━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `📝 <b>ТТН:</b> ${escapeHtml(waybill.ttnNumber)}`,
    `👤 <b>Водитель:</b> ${escapeHtml(waybill.driverFullName)}`,
    `📍 <b>Маршрут:</b> ${escapeHtml(waybill.trip.route.senderContractor.name)} → ${escapeHtml(waybill.trip.route.receiverContractor.name)}`,
  ];

  if (waybill.trip.vehicle) {
    lines.push(`🚗 <b>ТС:</b> ${escapeHtml(waybill.trip.vehicle.brand)} ${escapeHtml(waybill.trip.vehicle.model)} · ${escapeHtml(waybill.trip.vehicle.licensePlate)}`);
  }
  if (waybill.trip.cargo) {
    lines.push(`📦 <b>Груз:</b> ${escapeHtml(waybill.trip.cargo.name)}`);
  }

  lines.push(
    ``,
    `━━━━━━━━━━━━━━━━━━━━━`,
    `⚖️ <b>Вес брутто:</b> ${Number(waybill.weight).toFixed(2)} т`,
    `⚖️ <b>Вес нетто:</b> ${Number(waybill.loadWeight).toFixed(2)} т`,
    `🕐 ${formatDateTime(waybill.submittedAt)}`,
  );

  return lines.join('\n');
}
