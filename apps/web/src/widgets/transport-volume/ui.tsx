"use client";

import React, { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { ChartLineUp } from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/shared/ui/chart';
import { WidgetSkeleton } from '@/shared/ui/widget-skeleton';
import { WidgetEmpty } from '@/shared/ui/widget-empty';
import { useWaybills } from '@/entities/waybill/api';

const animationConfig = {
  glowWidth: 300,
};

const chartConfig = {
  weight: {
    label: 'Объём (т)',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export function TransportVolume() {
  const { data: waybills, isLoading } = useWaybills();
  const [xAxis, setXAxis] = React.useState<number | null>(null);

  const chartData = useMemo(() => {
    const last7 = getLast7Days();
    return last7.map((day) => {
      const dayWaybills = waybills?.filter((w) => w.submittedAt.startsWith(day)) ?? [];
      const weight = dayWaybills.reduce((sum, w) => sum + Number(w.weight), 0);
      return {
        day: new Date(day).toLocaleDateString('ru-RU', { weekday: 'short' }),
        weight: Number(weight.toFixed(2)),
      };
    });
  }, [waybills]);

  const hasData = chartData.some((d) => d.weight > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Объём перевозок</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <WidgetSkeleton variant="chart" />
        ) : !hasData ? (
          <WidgetEmpty icon={ChartLineUp} message="Нет данных по накладным за 7 дней" />
        ) : (
          <ChartContainer config={chartConfig}>
            <AreaChart
              accessibilityLayer
              data={chartData}
              onMouseMove={(e) => setXAxis((e as unknown as { chartX?: number }).chartX ?? null)}
              onMouseLeave={() => setXAxis(null)}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <defs>
                <linearGradient
                  id="transport-volume-mask-grad"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="50%" stopColor="white" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
                <linearGradient
                  id="transport-volume-grad-weight"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--color-weight)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-weight)"
                    stopOpacity={0}
                  />
                </linearGradient>
                {xAxis && (
                  <mask id="transport-volume-mask">
                    <rect
                      x={xAxis - animationConfig.glowWidth / 2}
                      y={0}
                      width={animationConfig.glowWidth}
                      height="100%"
                      fill="url(#transport-volume-mask-grad)"
                    />
                  </mask>
                )}
              </defs>
              <Area
                dataKey="weight"
                type="natural"
                fill="url(#transport-volume-grad-weight)"
                fillOpacity={0.4}
                stroke="var(--color-weight)"
                strokeWidth={0.8}
                mask="url(#transport-volume-mask)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
