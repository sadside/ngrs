import { useTrips } from '@/entities/trip/api';
import { useWaybills } from '@/entities/waybill/api';
import { TripStatusBadge } from '@/entities/trip/ui';
import { DashboardStats } from '@/widgets/dashboard-stats/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';

const ACTIVE_STATUSES = ['EN_ROUTE_TO_LOADING', 'LOADING', 'EN_ROUTE_TO_UNLOADING', 'UNLOADING'];

export function DashboardPage() {
  const { data: trips } = useTrips();
  const { data: waybills } = useWaybills();

  const today = new Date().toISOString().split('T')[0];

  const tripsToday = trips?.filter((t) => t.assignedAt.startsWith(today)) ?? [];
  const activeTrips = trips?.filter((t) => ACTIVE_STATUSES.includes(t.status)) ?? [];
  const completedToday =
    trips?.filter((t) => t.status === 'COMPLETED' && t.completedAt?.startsWith(today)) ?? [];
  const waybillsToday = waybills?.filter((w) => w.submittedAt.startsWith(today)) ?? [];
  const recentWaybills = waybills?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      <DashboardStats
        tripsToday={tripsToday.length}
        activeTrips={activeTrips.length}
        completedToday={completedToday.length}
        waybillsToday={waybillsToday.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active trips — left 2/3 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Активные рейсы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeTrips.length === 0 && (
              <p className="text-sm text-muted-foreground">Нет активных рейсов</p>
            )}
            {activeTrips.map((trip) => (
              <div
                key={trip.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {trip.route.loadingAddress} &rarr; {trip.route.unloadingAddress}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {trip.driver.fullName} &middot; {trip.vehicle.licensePlate}
                  </p>
                </div>
                <TripStatusBadge status={trip.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent waybills — right 1/3 */}
        <Card>
          <CardHeader>
            <CardTitle>Последние накладные</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentWaybills.length === 0 && (
              <p className="text-sm text-muted-foreground">Нет накладных</p>
            )}
            {recentWaybills.map((wb) => (
              <div key={wb.id} className="space-y-1 rounded-lg border p-3">
                <p className="text-sm font-medium">{wb.ttnNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {wb.driverFullName} &middot;{' '}
                  {new Date(wb.submittedAt).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
