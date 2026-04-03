import { TripsTable } from '@/widgets/trips-table/ui';
import { CreateTripDialog } from '@/features/create-trip/ui';

export function TripsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Рейсы</h1>
        <CreateTripDialog />
      </div>
      <TripsTable />
    </div>
  );
}
