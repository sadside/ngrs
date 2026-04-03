import { useTrips } from '@/entities/trip/api';
import { useWaybills } from '@/entities/waybill/api';
import { TripStatusBadge } from '@/entities/trip/ui';
import { DashboardStats } from '@/widgets/dashboard-stats/ui';
import { Card } from '@/shared/ui/card';
import { cn } from '@/shared/lib/utils';
import { ClipboardText, Package, Truck } from '@phosphor-icons/react';

const TRIP_STATUS_CONFIG = {
  ASSIGNED: {
    icon: ClipboardText,
    iconBg: 'bg-secondary-100',
    iconColor: 'text-secondary-500',
  },
  EN_ROUTE_TO_LOADING: {
    icon: Truck,
    iconBg: 'bg-accent-50',
    iconColor: 'text-accent-500',
  },
  LOADING: {
    icon: Package,
    iconBg: 'bg-primary-50',
    iconColor: 'text-primary-500',
  },
  EN_ROUTE_TO_UNLOADING: {
    icon: Truck,
    iconBg: 'bg-accent-50',
    iconColor: 'text-accent-500',
  },
  UNLOADING: {
    icon: Package,
    iconBg: 'bg-primary-50',
    iconColor: 'text-primary-500',
  },
} as const;

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
          <div className="px-5 py-3">
            <h2 className="font-semibold text-secondary-900">Активные рейсы</h2>
          </div>
          {activeTrips.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-secondary-400">Нет активных рейсов</p>
            </div>
          ) : (
            <div className="divide-y divide-secondary-100">
              {activeTrips.map((trip) => {
                const config = TRIP_STATUS_CONFIG[trip.status as keyof typeof TRIP_STATUS_CONFIG];
                const StatusIcon = config?.icon ?? Truck;
                const statusIconBg = config?.iconBg ?? 'bg-secondary-100';
                const statusIconColor = config?.iconColor ?? 'text-secondary-500';

                return (
                  <div
                    key={trip.id}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-secondary-50/50 transition-colors"
                  >
                    <div className={cn('p-2.5 rounded-lg', statusIconBg)}>
                      <StatusIcon size={20} className={statusIconColor} weight="duotone" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-secondary-900 truncate">
                        {trip.route.senderContractor.name} &rarr; {trip.route.receiverContractor.name}
                      </p>
                      <p className="text-sm text-secondary-500 truncate">
                        {trip.cargo.name} &middot; {trip.vehicle.licensePlate}
                      </p>
                      <p className="text-xs text-secondary-400">{trip.driver.fullName}</p>
                    </div>
                    <TripStatusBadge status={trip.status} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Recent waybills — right 1/3 */}
        <Card className="bg-white rounded-xl shadow-sm border border-secondary-100">
          <div className="px-5 py-3">
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
