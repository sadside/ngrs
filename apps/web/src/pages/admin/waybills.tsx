import { WaybillsTable } from '@/widgets/waybills-table/ui';
import { PageHeader } from '@/widgets/page-header/ui';

export function WaybillsPage() {
  return (
    <div className="flex flex-col flex-1 gap-4">
      <PageHeader title="Накладные" />
      <WaybillsTable />
    </div>
  );
}
