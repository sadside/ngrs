export interface TodaySummary {
  date: Date;
  assigned: number;
  completed: number;
  inRoute: number;
  waybillsCount: number;
  totalWeight: number;
  activeDrivers: number;
}

export function renderTodaySummary(summary: TodaySummary): string {
  const dateLabel = summary.date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return [
    `📊 <b>Сводка за ${dateLabel}</b>`,
    ``,
    `🚚 Назначено рейсов: ${summary.assigned}`,
    `✅ Завершено рейсов: ${summary.completed}`,
    `⏳ В пути: ${summary.inRoute}`,
    `📄 Накладных отправлено: ${summary.waybillsCount}`,
    `⚖️ Общий вес: ${summary.totalWeight.toFixed(2)} т`,
    ``,
    `Активных водителей: ${summary.activeDrivers}`,
  ].join('\n');
}
