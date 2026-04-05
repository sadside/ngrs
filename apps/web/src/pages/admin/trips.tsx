import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/widgets/page-header/ui';
import { DataTable, getSelectColumn } from '@/shared/ui/data-table';
import { DataTableColumnHeader } from '@/shared/ui/data-table/column-header';
import { RowActions } from '@/shared/ui/data-table/row-actions';
import { TripStatusBadge } from '@/entities/trip/ui';
import { useTrips, type Trip } from '@/entities/trip/api';
import { TRIP_STATUS_LABELS } from '@/shared/config/constants';
import { CreateTripDialog } from '@/features/create-trip/ui';
import { toast } from 'sonner';

const columns: ColumnDef<Trip>[] = [
  getSelectColumn<Trip>(),
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Статус" />,
    cell: ({ row }) => <TripStatusBadge status={row.original.status} />,
    filterFn: (row, id, value) => value === undefined || row.getValue(id) === value,
  },
  {
    id: 'driver',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Водитель" />,
    accessorFn: (row) => row.driver.fullName,
  },
  {
    id: 'route',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Маршрут" />,
    accessorFn: (row) => `${row.route.senderContractor.name} → ${row.route.receiverContractor.name}`,
    cell: ({ row }) => (
      <span className="truncate max-w-[250px] block">
        {row.original.route.senderContractor.name} → {row.original.route.receiverContractor.name}
      </span>
    ),
  },
  {
    id: 'vehicle',
    header: ({ column }) => <DataTableColumnHeader column={column} title="ТС" />,
    accessorFn: (row) => row.vehicle.licensePlate,
  },
  {
    id: 'cargo',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Груз" />,
    accessorFn: (row) => row.cargo.name,
  },
  {
    id: 'ttn',
    header: ({ column }) => <DataTableColumnHeader column={column} title="ТТН" />,
    accessorFn: (row) => row.waybill?.ttnNumber ?? '',
    cell: ({ row }) => row.original.waybill?.ttnNumber ?? '—',
  },
  {
    accessorKey: 'assignedAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Дата" />,
    cell: ({ row }) => new Date(row.original.assignedAt).toLocaleDateString('ru-RU'),
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: () => (
      <RowActions onDelete={() => toast.info('Удаление рейсов будет добавлено позже')} />
    ),
    size: 50,
  },
];

export function TripsPage() {
  const { data: trips, isLoading } = useTrips();
  const [createOpen, setCreateOpen] = useState(false);

  const statusFilterOptions = Object.entries(TRIP_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <PageHeader title="Рейсы" />
      <CreateTripDialog open={createOpen} onOpenChange={setCreateOpen} />
      <DataTable
        columns={columns}
        data={trips ?? []}
        isLoading={isLoading}
        searchPlaceholder="Поиск по водителю, маршруту..."
        filterOptions={[{ key: 'status', label: 'Статус', options: statusFilterOptions }]}
        onCreateClick={() => setCreateOpen(true)}
        createLabel="Создать рейс"
      />
    </div>
  );
}
