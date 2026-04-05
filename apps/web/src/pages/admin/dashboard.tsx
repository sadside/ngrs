import { useUnit } from 'effector-react';
import { $user } from '@/entities/session/model';
import { PageHeader } from '@/widgets/page-header/ui';
import { DashboardStats } from '@/widgets/dashboard-stats';
import { TripsPerWeek } from '@/widgets/trips-per-week';
import { TripsByStatus } from '@/widgets/trips-by-status';
import { TopDrivers } from '@/widgets/top-drivers';
import { RecentTrips } from '@/widgets/trips-table';
import { RecentWaybills } from '@/widgets/waybills-table';

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

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${user?.fullName ?? ''}`}
        description="Вот сводка за сегодня"
      />
      <DashboardStats />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TripsPerWeek />
        <TripsByStatus />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopDrivers />
        <RecentTrips />
      </div>
      <RecentWaybills />
    </div>
  );
}
