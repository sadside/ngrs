import { TripsTable } from '@/widgets/trips-table/ui';
import { PageHeader } from '@/widgets/page-header/ui';

export function TripsPage() {
  return (
    <div className="flex flex-col flex-1 gap-4">
      <PageHeader title="Рейсы" />
      <TripsTable />
    </div>
  );
}
