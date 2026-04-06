import { escapeHtml, formatDateTime } from './utils';

export interface WaybillForTemplate {
  id: string;
  ttnNumber: string;
  driverFullName: string;
  weight: unknown; // Prisma Decimal
  loadWeight: unknown;
  submittedAt: Date;
  trip: {
    route: {
      senderContractor: { name: string };
      receiverContractor: { name: string };
    };
  };
}

export function renderWaybillMessage(waybill: WaybillForTemplate): string {
  return [
    `📄 <b>Новая накладная</b>`,
    ``,
    `<b>ТТН:</b> ${escapeHtml(waybill.ttnNumber)}`,
    `<b>Водитель:</b> ${escapeHtml(waybill.driverFullName)}`,
    `<b>Маршрут:</b> ${escapeHtml(waybill.trip.route.senderContractor.name)} → ${escapeHtml(waybill.trip.route.receiverContractor.name)}`,
    `<b>Вес брутто:</b> ${Number(waybill.weight).toFixed(2)} т`,
    `<b>Вес нетто:</b> ${Number(waybill.loadWeight).toFixed(2)} т`,
    `<b>Время:</b> ${formatDateTime(waybill.submittedAt)}`,
  ].join('\n');
}
