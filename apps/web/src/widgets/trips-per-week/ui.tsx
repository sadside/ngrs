"use client";

import React, { useMemo } from 'react';
import { Bar, BarChart, XAxis, Cell } from 'recharts';
import { ChartLineUp } from '@phosphor-icons/react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/shared/ui/chart';
import { useTrips } from '@/entities/trip/api';
import { WidgetSkeleton } from '@/shared/ui/widget-skeleton';
import { WidgetEmpty } from '@/shared/ui/widget-empty';

const chartConfig = {
  trips: {
    label: 'Рейсы',
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

export function TripsPerWeek() {
  const { data: trips, isLoading } = useTrips();
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const chartData = useMemo(() => {
    const last7 = getLast7Days();
    return last7.map((day) => ({
      day: new Date(day).toLocaleDateString('ru-RU', { weekday: 'short' }),
      trips: trips?.filter((t) => t.assignedAt.startsWith(day)).length ?? 0,
    }));
  }, [trips]);

  const hasData = chartData.some((d) => d.trips > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Рейсы за неделю</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <WidgetSkeleton variant="chart" />
        ) : !hasData ? (
          <WidgetEmpty
            icon={(props) => <ChartLineUp {...(props as React.ComponentProps<typeof ChartLineUp>)} />}
            message="Нет рейсов за последние 7 дней"
          />
        ) : (
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={chartData}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <rect x="0" y="0" width="100%" height="85%" fill="url(#highlighted-pattern-dots)" />
              <defs>
                <DottedBackgroundPattern />
              </defs>
              <XAxis
                dataKey="day"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="trips" radius={6} fill="var(--color-primary)">
                {chartData.map((_, index) => (
                  <Cell
                    className="duration-200"
                    key={`cell-${index}`}
                    fillOpacity={activeIndex === null ? 1 : activeIndex === index ? 1 : 0.3}
                    stroke={activeIndex === index ? 'var(--color-primary)' : ''}
                    onMouseEnter={() => setActiveIndex(index)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

const DottedBackgroundPattern = () => (
  <pattern id="highlighted-pattern-dots" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
    <circle className="dark:text-muted/40 text-muted" cx="2" cy="2" r="1" fill="currentColor" />
  </pattern>
);
