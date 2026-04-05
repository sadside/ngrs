import { type ColumnDef, type Row } from '@tanstack/react-table';
import { PageHeader } from '@/widgets/page-header/ui';
import { DataTable, getSelectColumn } from '@/shared/ui/data-table';
import { DataTableColumnHeader } from '@/shared/ui/data-table/column-header';
import { RowActions } from '@/shared/ui/data-table/row-actions';
import { Card } from '@/shared/ui/card';
import { useWaybills, type Waybill } from '@/entities/waybill/api';
import { toast } from 'sonner';

const columns: ColumnDef<Waybill>[] = [
  getSelectColumn<Waybill>(),
  {
    accessorKey: 'ttnNumber',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Номер ТТН" />,
    cell: ({ row }) => <span className="font-medium">{row.original.ttnNumber}</span>,
  },
  {
    accessorKey: 'driverFullName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Водитель" />,
  },
  {
    accessorKey: 'weight',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Вес (тн)" />,
    cell: ({ row }) => Number(row.original.weight).toFixed(2),
  },
  {
    accessorKey: 'loadWeight',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Вес налива (тн)" />,
    cell: ({ row }) => Number(row.original.loadWeight).toFixed(2),
  },
  {
    id: 'route',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Маршрут" />,
    accessorFn: (row) => `${row.trip.route.senderContractor.name} → ${row.trip.route.receiverContractor.name}`,
    cell: ({ row }) => (
      <span className="truncate max-w-[200px] block">
        {row.original.trip.route.senderContractor.name} → {row.original.trip.route.receiverContractor.name}
      </span>
    ),
  },
  {
    accessorKey: 'submittedAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Дата" />,
    cell: ({ row }) =>
      new Date(row.original.submittedAt).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: () => (
      <RowActions onView={() => toast.info('Просмотр накладной будет добавлен позже')} />
    ),
    size: 50,
  },
];

function renderWaybillCard(row: Row<Waybill>) {
  const wb = row.original;
  return (
    <Card className="p-4 gap-2">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-input"
          aria-label="Выбрать"
        />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground truncate">ТТН {wb.ttnNumber}</div>
          <div className="text-sm text-muted-foreground truncate">{wb.driverFullName}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Вес (т)</div>
          <div className="text-foreground">{Number(wb.weight).toFixed(2)}</div>
        </div>
        <div>
          <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Вес налива (т)</div>
          <div className="text-foreground">{Number(wb.loadWeight).toFixed(2)}</div>
        </div>
        <div className="col-span-2">
          <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Маршрут</div>
          <div className="text-foreground truncate">
            {wb.trip.route.senderContractor.name} → {wb.trip.route.receiverContractor.name}
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Дата</div>
          <div className="text-foreground">
            {new Date(wb.submittedAt).toLocaleString('ru-RU', {
              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function WaybillsPage() {
  const { data: waybills, isLoading } = useWaybills();

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <PageHeader title="Накладные" />
      <DataTable
        columns={columns}
        data={waybills ?? []}
        isLoading={isLoading}
        searchPlaceholder="Поиск по ТТН, водителю..."
        mobileCardRenderer={renderWaybillCard}
      />
    </div>
  );
}
