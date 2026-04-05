import { useMemo } from 'react';
import { Truck } from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { WidgetSkeleton } from '@/shared/ui/widget-skeleton';
import { WidgetEmpty } from '@/shared/ui/widget-empty';
import { TripStatusBadge } from '@/entities/trip/ui';
import { useTrips } from '@/entities/trip/api';

export function RecentTrips() {
  const { data: trips, isLoading } = useTrips();

  const recent = useMemo(
    () =>
      [...(trips ?? [])]
        .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())
        .slice(0, 10),
    [trips],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Последние рейсы</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <WidgetSkeleton variant="table" />
        ) : recent.length === 0 ? (
          <WidgetEmpty icon={Truck} message="Нет рейсов" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3 font-medium">Код</th>
                  <th className="py-2 pr-3 font-medium">Водитель</th>
                  <th className="py-2 pr-3 font-medium">Маршрут</th>
                  <th className="py-2 pr-3 font-medium">Статус</th>
                  <th className="py-2 font-medium">Дата</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recent.map((trip) => (
                  <tr key={trip.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 pr-3 font-medium text-foreground whitespace-nowrap">
                      {trip.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="py-2.5 pr-3 text-foreground whitespace-nowrap">
                      {trip.driver.fullName}
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground truncate max-w-[200px]">
                      {trip.route.senderContractor.name} → {trip.route.receiverContractor.name}
                    </td>
                    <td className="py-2.5 pr-3">
                      <TripStatusBadge status={trip.status} />
                    </td>
                    <td className="py-2.5 text-muted-foreground whitespace-nowrap">
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
      </CardContent>
    </Card>
  );
}
