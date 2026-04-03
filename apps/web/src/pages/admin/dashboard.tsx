import { useTrips } from '@/entities/trip/api';
import { useWaybills } from '@/entities/waybill/api';
import { TripStatusBadge } from '@/entities/trip/ui';
import { DashboardStats } from '@/widgets/dashboard-stats/ui';
import { Card } from '@/shared/ui/card';

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
        <Card className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-secondary-100">
          <div className="p-5 border-b border-secondary-100">
            <h2 className="font-semibold text-secondary-900">Активные рейсы</h2>
          </div>
          <div className="p-5 space-y-3">
            {activeTrips.length === 0 && (
              <p className="text-sm text-secondary-400">Нет активных рейсов</p>
            )}
            {activeTrips.map((trip) => (
              <div
                key={trip.id}
                className="flex items-center justify-between rounded-lg border border-secondary-100 p-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-secondary-900">
                    {trip.route.loadingAddress} &rarr; {trip.route.unloadingAddress}
                  </p>
                  <p className="text-xs text-secondary-400">
                    {trip.driver.fullName} &middot; {trip.vehicle.licensePlate}
                  </p>
                </div>
                <TripStatusBadge status={trip.status} />
              </div>
            ))}
          </div>
        </Card>

        {/* Recent waybills — right 1/3 */}
        <Card className="bg-white rounded-xl shadow-sm border border-secondary-100">
          <div className="p-5 border-b border-secondary-100">
            <h2 className="font-semibold text-secondary-900">Последние накладные</h2>
          </div>
          <div className="divide-y divide-secondary-100">
            {recentWaybills.length === 0 && (
              <p className="text-sm text-secondary-400 px-5 py-3">Нет накладных</p>
            )}
            {recentWaybills.map((wb) => (
              <div key={wb.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-secondary-900">ТТН {wb.ttnNumber}</p>
                  <p className="text-sm text-secondary-400">{wb.driverFullName}</p>
                </div>
                <span className="text-sm text-secondary-400">
                  {new Date(wb.submittedAt).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
