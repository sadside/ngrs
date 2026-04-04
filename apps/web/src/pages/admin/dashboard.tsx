import { useMemo } from 'react';
import { useUnit } from 'effector-react';
import { $user } from '@/entities/session/model';
import { PageHeader } from '@/widgets/page-header/ui';
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
  Warning,
} from '@phosphor-icons/react';
import { Badge } from '@/shared/ui/badge';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  BarChart,
  LineChart,
  PieChart,
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

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
}

export function DashboardPage() {
  const user = useUnit($user);
  const greeting = getGreeting();
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
  const dayFullDates = useMemo(
    () =>
      last7.map((d) =>
        new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
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

  const donutOption = useMemo(() => {
    const statusCounts = [
      { name: 'Назначен', value: trips?.filter(t => t.status === 'ASSIGNED').length ?? 0, color: '#606E80' },
      { name: 'В пути', value: trips?.filter(t => ['EN_ROUTE_TO_LOADING', 'EN_ROUTE_TO_UNLOADING'].includes(t.status)).length ?? 0, color: '#3765F6' },
      { name: 'Погрузка/Выгрузка', value: trips?.filter(t => ['LOADING', 'UNLOADING'].includes(t.status)).length ?? 0, color: '#F59E0B' },
      { name: 'Завершён', value: trips?.filter(t => t.status === 'COMPLETED').length ?? 0, color: '#70FC8E' },
      { name: 'Отменён', value: trips?.filter(t => t.status === 'CANCELLED').length ?? 0, color: '#EF4444' },
    ].filter(s => s.value > 0);

    return {
      tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
      series: [{
        type: 'pie' as const,
        radius: ['55%', '80%'],
        center: ['50%', '50%'],
        itemStyle: { borderRadius: 6, borderColor: 'transparent', borderWidth: 2 },
        label: { show: false },
        data: statusCounts.map(s => ({ name: s.name, value: s.value, itemStyle: { color: s.color } })),
      }],
    };
  }, [trips]);

  const alertTrips = useMemo(() => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    return (trips ?? []).filter(t =>
      t.status !== 'ASSIGNED' &&
      t.status !== 'COMPLETED' &&
      t.status !== 'CANCELLED' &&
      !t.waybill &&
      new Date(t.assignedAt).getTime() < twoHoursAgo
    );
  }, [trips]);

  const tripsChartOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis' as const,
        formatter: (params: any) => {
          const idx = params[0]?.dataIndex ?? 0;
          const val = params[0]?.value ?? 0;
          return `<b>${dayFullDates[idx]}</b><br/>Рейсов: ${val}`;
        },
      },
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
    [dayLabels, dayFullDates, tripsPerDay],
  );

  const weightChartOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis' as const,
        formatter: (params: any) => {
          const idx = params[0]?.dataIndex ?? 0;
          const val = params[0]?.value ?? 0;
          return `<b>${dayFullDates[idx]}</b><br/>Вес: ${val} тн`;
        },
      },
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
    [dayLabels, dayFullDates, weightPerDay],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${user?.fullName ?? ''}`}
        description="Вот сводка за сегодня"
      />
      {/* Row 1: Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Рейсов сегодня"
          value={tripsToday.length}
          trend={`${Math.abs(trendPercent)}%`}
          trendUp={trendPercent >= 0}
          icon={Truck}
          dark
          index={0}
        />
        <StatCard
          label="В пути"
          value={activeTrips.length}
          icon={Path}
          index={1}
        />
        <StatCard
          label="Завершено"
          value={completedToday.length}
          icon={CheckCircle}
          index={2}
        />
        <StatCard
          label="Накладных"
          value={waybillsToday.length}
          icon={FileText}
          index={3}
        />
        <StatCard
          label="Водителей"
          value={activeDrivers}
          icon={Users}
          index={4}
        />
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">
            Рейсы за неделю
          </h3>
          <ReactEChartsCore
            echarts={echarts}
            option={tripsChartOption}
            style={{ height: 280 }}
          />
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">
            Объём перевозок (тн)
          </h3>
          <ReactEChartsCore
            echarts={echarts}
            option={weightChartOption}
            style={{ height: 280 }}
          />
        </div>
      </div>

      {/* Row 3: Recent trips + Donut + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Recent trips — 2 cols */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border">
          <div className="px-5 py-3 flex items-center justify-between border-b border-border">
            <div>
              <h3 className="font-semibold text-foreground">
                Последние рейсы
              </h3>
              <p className="text-xs text-muted-foreground">
                Обновлено за последний час
              </p>
            </div>
          </div>
          {recentTrips.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <div className="p-3 rounded-2xl bg-primary/10">
                <Truck size={32} weight="light" className="text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Нет рейсов
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Создайте рейс в разделе «Рейсы»
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border">
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
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-5 py-2.5 font-medium text-foreground whitespace-nowrap">
                        {trip.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-5 py-2.5 text-foreground whitespace-nowrap">
                        {trip.driver.fullName}
                      </td>
                      <td className="px-5 py-2.5 text-muted-foreground truncate max-w-[200px]">
                        {trip.route.senderContractor.name} &rarr;{' '}
                        {trip.route.receiverContractor.name}
                      </td>
                      <td className="px-5 py-2.5">
                        <TripStatusBadge status={trip.status} />
                      </td>
                      <td className="px-5 py-2.5 text-muted-foreground whitespace-nowrap">
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

        {/* Donut chart — 1 col */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-2">Статусы рейсов</h3>
          <ReactEChartsCore echarts={echarts} option={donutOption} style={{ height: 200 }} />
        </div>

        {/* Alerts — 1 col */}
        <div className="bg-card rounded-xl border border-border">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <Warning size={18} className="text-warning" weight="duotone" />
            <h3 className="font-semibold text-foreground">Внимание</h3>
            {alertTrips.length > 0 && (
              <Badge variant="warning" size="sm">{alertTrips.length}</Badge>
            )}
          </div>
          {alertTrips.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <div className="p-3 rounded-2xl bg-accent/10">
                <CheckCircle size={28} weight="light" className="text-accent" />
              </div>
              <p className="text-sm text-muted-foreground">Все накладные отправлены вовремя</p>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
              {alertTrips.map(trip => (
                <div key={trip.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-warning/10 mt-0.5">
                    <Warning size={16} className="text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {trip.route.senderContractor.name} → {trip.route.receiverContractor.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {trip.driver.fullName} · {Math.round((Date.now() - new Date(trip.assignedAt).getTime()) / 3600000)}ч назад
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Recent waybills */}
      <div className="bg-card rounded-xl border border-border">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="font-semibold text-foreground">
            Последние накладные
          </h3>
        </div>
        {recentWaybills.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="p-3 rounded-2xl bg-accent/10">
              <FileText
                size={32}
                weight="light"
                className="text-accent"
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Нет накладных
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Накладные появятся после отправки водителями
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {recentWaybills.map((wb) => (
              <div key={wb.id} className="flex items-center gap-3 px-4 py-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText
                    size={18}
                    className="text-primary"
                    weight="duotone"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">
                    ТТН {wb.ttnNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {wb.driverFullName}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
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
  );
}
