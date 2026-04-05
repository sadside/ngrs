"use client";

import React, { useMemo } from 'react';
import { Bar, BarChart, XAxis, Cell, Tooltip } from 'recharts';
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

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatTooltipTitle(iso: string) {
  const d = new Date(iso);
  const weekday = capitalize(d.toLocaleDateString('ru-RU', { weekday: 'long' }));
  const date = d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return `${weekday} ${date}`;
}

interface DriverCount {
  name: string;
  count: number;
}

interface ChartPoint {
  day: string;
  fullDate: string;
  trips: number;
  drivers: DriverCount[];
}

function TripsTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: ChartPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="grid min-w-[12rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">{point.fullDate}</div>
      <div className="flex items-center justify-between gap-4 leading-none">
        <span className="text-muted-foreground">Рейсы</span>
        <span className="font-mono font-medium text-foreground tabular-nums">
          {point.trips}
        </span>
      </div>
      {point.drivers.length > 0 && (
        <div className="mt-1 border-t border-border/50 pt-1.5 space-y-1">
          {point.drivers.map((d) => (
            <div
              key={d.name}
              className="flex items-center justify-between gap-4 leading-none"
            >
              <span className="text-muted-foreground truncate">{d.name}</span>
              <span className="font-mono font-medium text-foreground tabular-nums">
                {d.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TripsPerWeek() {
  const { data: trips, isLoading } = useTrips();
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const chartData = useMemo<ChartPoint[]>(() => {
    const last7 = getLast7Days();
    return last7.map((day) => {
      const dayTrips = trips?.filter((t) => t.assignedAt.startsWith(day)) ?? [];
      const driverMap = new Map<string, DriverCount>();
      for (const trip of dayTrips) {
        const existing = driverMap.get(trip.driver.id);
        if (existing) {
          existing.count += 1;
        } else {
          driverMap.set(trip.driver.id, { name: trip.driver.fullName, count: 1 });
        }
      }
      const drivers = Array.from(driverMap.values()).sort((a, b) => b.count - a.count);
      return {
        day: new Date(day).toLocaleDateString('ru-RU', { weekday: 'short' }),
        fullDate: formatTooltipTitle(day),
        trips: dayTrips.length,
        drivers,
      };
    });
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
          <WidgetEmpty icon={ChartLineUp} message="Нет рейсов за последние 7 дней" />
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
              <Tooltip cursor={false} content={<TripsTooltip />} />
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
