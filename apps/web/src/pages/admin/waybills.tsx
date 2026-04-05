import { type ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/widgets/page-header/ui';
import { DataTable, getSelectColumn } from '@/shared/ui/data-table';
import { DataTableColumnHeader } from '@/shared/ui/data-table/column-header';
import { RowActions } from '@/shared/ui/data-table/row-actions';
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

export function WaybillsPage() {
  const { data: waybills, isLoading } = useWaybills();

  return (
    <div className="flex flex-col flex-1">
      <PageHeader title="Накладные" />
      <DataTable
        columns={columns}
        data={waybills ?? []}
        isLoading={isLoading}
        searchPlaceholder="Поиск по ТТН, водителю..."
      />
    </div>
  );
}
