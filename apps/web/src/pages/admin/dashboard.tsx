import { useMemo } from 'react';
import { useTrips } from '@/entities/trip/api';
import { useWaybills } from '@/entities/waybill/api';
import { TripStatusBadge } from '@/entities/trip/ui';
import { StatCard } from '@/widgets/dashboard-stats/ui';
import {
  Truck,
  Path,
  CheckCircle,
  FileText,
  Users,
} from '@phosphor-icons/react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);

const ACTIVE_STATUSES = [
  'EN_ROUTE_TO_LOADING',
  'LOADING',
  'EN_ROUTE_TO_UNLOADING',
  'UNLOADING',
];

function getLast7Days() {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export function DashboardPage() {
  const { data: trips } = useTrips();
  const { data: waybills } = useWaybills();

  const today = new Date().toISOString().split('T')[0];
  const yesterday = getYesterday();

  const tripsToday = useMemo(
    () => trips?.filter((t) => t.assignedAt.startsWith(today)) ?? [],
    [trips, today],
  );
  const tripsYesterday = useMemo(
    () => trips?.filter((t) => t.assignedAt.startsWith(yesterday)) ?? [],
    [trips, yesterday],
  );
  const activeTrips = useMemo(
    () => trips?.filter((t) => ACTIVE_STATUSES.includes(t.status)) ?? [],
    [trips],
  );
  const completedToday = useMemo(
    () =>
      trips?.filter(
        (t) => t.status === 'COMPLETED' && t.completedAt?.startsWith(today),
      ) ?? [],
    [trips, today],
  );
  const waybillsToday = useMemo(
    () => waybills?.filter((w) => w.submittedAt.startsWith(today)) ?? [],
    [waybills, today],
  );
  const activeDrivers = useMemo(
    () => new Set(activeTrips.map((t) => t.driver.id)).size,
    [activeTrips],
  );

  // Trend calculation
  const trendPercent = useMemo(() => {
    if (tripsYesterday.length === 0) return tripsToday.length > 0 ? 100 : 0;
    return Math.round(
      ((tripsToday.length - tripsYesterday.length) / tripsYesterday.length) *
        100,
    );
  }, [tripsToday.length, tripsYesterday.length]);

  // Chart data
  const last7 = useMemo(() => getLast7Days(), []);
  const dayLabels = useMemo(
    () =>
      last7.map((d) =>
        new Date(d).toLocaleDateString('ru-RU', { weekday: 'short' }),
      ),
    [last7],
  );
  const tripsPerDay = useMemo(
    () =>
      last7.map(
        (day) => trips?.filter((t) => t.assignedAt.startsWith(day)).length ?? 0,
      ),
    [trips, last7],
  );
  const weightPerDay = useMemo(
    () =>
      last7.map((day) => {
        const dayWaybills =
          waybills?.filter((w) => w.submittedAt.startsWith(day)) ?? [];
        return dayWaybills.reduce((sum, w) => sum + Number(w.weight), 0);
      }),
    [waybills, last7],
  );

  // Recent trips (last 10)
  const recentTrips = useMemo(
    () =>
      [...(trips ?? [])]
        .sort(
          (a, b) =>
            new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime(),
        )
        .slice(0, 10),
    [trips],
  );

  // Recent waybills (last 5)
  const recentWaybills = useMemo(
    () =>
      [...(waybills ?? [])]
        .sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() -
            new Date(a.submittedAt).getTime(),
        )
        .slice(0, 5),
    [waybills],
  );

  const tripsChartOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis' as const },
      grid: { left: 40, right: 20, top: 10, bottom: 30 },
      xAxis: {
        type: 'category' as const,
        data: dayLabels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#77808e', fontSize: 12 },
      },
      yAxis: {
        type: 'value' as const,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#e3e5e8', type: 'dashed' as const } },
        axisLabel: { color: '#77808e', fontSize: 12 },
      },
      series: [
        {
          type: 'bar' as const,
          data: tripsPerDay,
          itemStyle: { color: '#ffa600', borderRadius: [4, 4, 0, 0] },
          barWidth: '50%',
        },
      ],
    }),
    [dayLabels, tripsPerDay],
  );

  const weightChartOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis' as const },
      grid: { left: 50, right: 20, top: 10, bottom: 30 },
      xAxis: {
        type: 'category' as const,
        data: dayLabels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#77808e', fontSize: 12 },
      },
      yAxis: {
        type: 'value' as const,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#e3e5e8', type: 'dashed' as const } },
        axisLabel: { color: '#77808e', fontSize: 12 },
      },
      series: [
        {
          type: 'line' as const,
          data: weightPerDay,
          smooth: true,
          itemStyle: { color: '#1f3b61' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(31, 59, 97, 0.2)' },
              { offset: 1, color: 'rgba(31, 59, 97, 0)' },
            ]),
          },
          lineStyle: { width: 2 },
        },
      ],
    }),
    [dayLabels, weightPerDay],
  );

  return (
    <div className="space-y-6">
      {/* Row 1: Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Рейсов сегодня"
          value={tripsToday.length}
          trend={`${Math.abs(trendPercent)}%`}
          trendUp={trendPercent >= 0}
          icon={Truck}
          dark
        />
        <StatCard
          label="В пути"
          value={activeTrips.length}
          icon={Path}
        />
        <StatCard
          label="Завершено"
          value={completedToday.length}
          icon={CheckCircle}
        />
        <StatCard
          label="Накладных"
          value={waybillsToday.length}
          icon={FileText}
        />
        <StatCard
          label="Водителей"
          value={activeDrivers}
          icon={Users}
        />
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="font-semibold text-secondary-900 mb-4">
            Рейсы за неделю
          </h3>
          <ReactEChartsCore
            echarts={echarts}
            option={tripsChartOption}
            style={{ height: 280 }}
          />
        </div>

        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="font-semibold text-secondary-900 mb-4">
            Объём перевозок (тн)
          </h3>
          <ReactEChartsCore
            echarts={echarts}
            option={weightChartOption}
            style={{ height: 280 }}
          />
        </div>
      </div>

      {/* Row 3: Recent trips + Recent waybills */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent trips table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border">
          <div className="px-5 py-3 flex items-center justify-between border-b border-border">
            <div>
              <h3 className="font-semibold text-secondary-900">
                Последние рейсы
              </h3>
              <p className="text-xs text-secondary-400">
                Обновлено за последний час
              </p>
            </div>
          </div>
          {recentTrips.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <div className="p-3 rounded-2xl bg-primary-50">
                <Truck size={32} weight="light" className="text-primary-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-secondary-900">
                  Нет рейсов
                </p>
                <p className="text-xs text-secondary-400 mt-0.5">
                  Создайте рейс в разделе «Рейсы»
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-secondary-400 border-b border-border">
                    <th className="px-5 py-2 font-medium">Код</th>
                    <th className="px-5 py-2 font-medium">Водитель</th>
                    <th className="px-5 py-2 font-medium">Маршрут</th>
                    <th className="px-5 py-2 font-medium">Статус</th>
                    <th className="px-5 py-2 font-medium">Дата</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentTrips.map((trip) => (
                    <tr
                      key={trip.id}
                      className="hover:bg-secondary-50/50 transition-colors"
                    >
                      <td className="px-5 py-2.5 font-medium text-secondary-900 whitespace-nowrap">
                        {trip.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-5 py-2.5 text-secondary-700 whitespace-nowrap">
                        {trip.driver.fullName}
                      </td>
                      <td className="px-5 py-2.5 text-secondary-500 truncate max-w-[200px]">
                        {trip.route.senderContractor.name} &rarr;{' '}
                        {trip.route.receiverContractor.name}
                      </td>
                      <td className="px-5 py-2.5">
                        <TripStatusBadge status={trip.status} />
                      </td>
                      <td className="px-5 py-2.5 text-secondary-400 whitespace-nowrap">
                        {new Date(trip.assignedAt).toLocaleDateString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent waybills */}
        <div className="bg-white rounded-xl border border-border">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="font-semibold text-secondary-900">
              Последние накладные
            </h3>
          </div>
          {recentWaybills.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <div className="p-3 rounded-2xl bg-accent-50">
                <FileText
                  size={32}
                  weight="light"
                  className="text-accent-400"
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-secondary-900">
                  Нет накладных
                </p>
                <p className="text-xs text-secondary-400 mt-0.5">
                  Накладные появятся после отправки водителями
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
              {recentWaybills.map((wb) => (
                <div key={wb.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="p-2 rounded-lg bg-primary-50">
                    <FileText
                      size={18}
                      className="text-primary-500"
                      weight="duotone"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-secondary-900">
                      ТТН {wb.ttnNumber}
                    </p>
                    <p className="text-xs text-secondary-500">
                      {wb.driverFullName}
                    </p>
                  </div>
                  <span className="text-xs text-secondary-400 whitespace-nowrap">
                    {new Date(wb.submittedAt).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
