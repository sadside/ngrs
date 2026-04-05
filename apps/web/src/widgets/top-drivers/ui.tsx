import { useMemo } from 'react';
import { Users } from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { WidgetSkeleton } from '@/shared/ui/widget-skeleton';
import { WidgetEmpty } from '@/shared/ui/widget-empty';
import { useTrips } from '@/entities/trip/api';

interface DriverStat {
  id: string;
  fullName: string;
  tripCount: number;
}

export function TopDrivers() {
  const { data: trips, isLoading } = useTrips();

  const top = useMemo<DriverStat[]>(() => {
    if (!trips) return [];
    const counts = new Map<string, DriverStat>();
    for (const trip of trips) {
      const existing = counts.get(trip.driver.id);
      if (existing) {
        existing.tripCount += 1;
      } else {
        counts.set(trip.driver.id, {
          id: trip.driver.id,
          fullName: trip.driver.fullName,
          tripCount: 1,
        });
      }
    }
    return Array.from(counts.values())
      .sort((a, b) => b.tripCount - a.tripCount)
      .slice(0, 5);
  }, [trips]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Топ водителей</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <WidgetSkeleton variant="list" />
        ) : top.length === 0 ? (
          <WidgetEmpty icon={Users} message="Нет данных по водителям" />
        ) : (
          <ol className="space-y-3">
            {top.map((driver, i) => (
              <li key={driver.id} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-foreground truncate">{driver.fullName}</span>
                <span className="text-sm font-medium text-muted-foreground tabular-nums">
                  {driver.tripCount}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
