import { escapeHtml, formatDateTime } from './utils';

export interface WaybillListItem {
  id: string;
  ttnNumber: string;
  driverFullName: string;
  weight: unknown;
  loadWeight: unknown;
  submittedAt: Date;
  trip: {
    route: {
      senderContractor: { name: string };
      receiverContractor: { name: string };
    };
  };
}

export function renderWaybillsList(waybills: WaybillListItem[]): string {
  if (waybills.length === 0) return 'Нет накладных.';

  const lines = [`📄 <b>Последние ${waybills.length} накладных</b>`, ''];
  waybills.forEach((wb, i) => {
    lines.push(
      `${i + 1}. ТТН ${escapeHtml(wb.ttnNumber)} — ${escapeHtml(wb.driverFullName)}`,
      `   ${escapeHtml(wb.trip.route.senderContractor.name)} → ${escapeHtml(wb.trip.route.receiverContractor.name)}`,
      `   Вес: ${Number(wb.weight).toFixed(2)} т · ${formatDateTime(wb.submittedAt)}`,
      '',
    );
  });
  return lines.join('\n').trimEnd();
}
