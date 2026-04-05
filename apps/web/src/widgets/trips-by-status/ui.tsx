import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { ChartPie } from '@phosphor-icons/react';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { WidgetSkeleton } from '@/shared/ui/widget-skeleton';
import { WidgetEmpty } from '@/shared/ui/widget-empty';
import { useTrips } from '@/entities/trip/api';

echarts.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

export function TripsByStatus() {
  const { data: trips, isLoading } = useTrips();

  const option = useMemo(() => {
    const counts = [
      { name: 'Назначен', value: trips?.filter((t) => t.status === 'ASSIGNED').length ?? 0, color: '#606E80' },
      {
        name: 'В пути',
        value:
          trips?.filter((t) =>
            ['EN_ROUTE_TO_LOADING', 'EN_ROUTE_TO_UNLOADING'].includes(t.status),
          ).length ?? 0,
        color: '#3765F6',
      },
      {
        name: 'Погрузка/Выгрузка',
        value: trips?.filter((t) => ['LOADING', 'UNLOADING'].includes(t.status)).length ?? 0,
        color: '#F59E0B',
      },
      { name: 'Завершён', value: trips?.filter((t) => t.status === 'COMPLETED').length ?? 0, color: '#70FC8E' },
      { name: 'Отменён', value: trips?.filter((t) => t.status === 'CANCELLED').length ?? 0, color: '#EF4444' },
    ].filter((s) => s.value > 0);

    return {
      tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
      series: [
        {
          type: 'pie' as const,
          radius: ['55%', '80%'],
          center: ['50%', '50%'],
          itemStyle: { borderRadius: 6, borderColor: 'transparent', borderWidth: 2 },
          label: { show: false },
          data: counts.map((s) => ({ name: s.name, value: s.value, itemStyle: { color: s.color } })),
        },
      ],
    };
  }, [trips]);

  const hasData = (trips ?? []).length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Статусы рейсов</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <WidgetSkeleton variant="chart" />
        ) : !hasData ? (
          <WidgetEmpty icon={ChartPie} message="Нет рейсов для отображения" />
        ) : (
          <ReactEChartsCore echarts={echarts} option={option} style={{ height: 240 }} />
        )}
      </CardContent>
    </Card>
  );
}
