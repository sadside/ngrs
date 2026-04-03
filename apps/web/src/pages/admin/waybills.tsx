import { WaybillsTable } from '@/widgets/waybills-table/ui';

export function WaybillsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Накладные</h1>
      <WaybillsTable />
    </div>
  );
}
