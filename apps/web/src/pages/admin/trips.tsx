import { useState } from 'react';
import { type ColumnDef, type Row } from '@tanstack/react-table';
import { PageHeader } from '@/widgets/page-header/ui';
import { DataTable, getSelectColumn } from '@/shared/ui/data-table';
import { DataTableColumnHeader } from '@/shared/ui/data-table/column-header';
import { RowActions } from '@/shared/ui/data-table/row-actions';
import { Card } from '@/shared/ui/card';
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

function renderTripCard(row: Row<Trip>) {
  const trip = row.original;
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
          <div className="font-semibold text-foreground truncate">{trip.driver.fullName}</div>
          <div className="text-sm text-muted-foreground truncate">
            {trip.route.senderContractor.name} → {trip.route.receiverContractor.name}
          </div>
        </div>
        <TripStatusBadge status={trip.status} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-muted-foreground uppercase tracking-wider text-[10px]">ТС</div>
          <div className="text-foreground">{trip.vehicle.licensePlate}</div>
        </div>
        <div>
          <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Груз</div>
          <div className="text-foreground truncate">{trip.cargo.name}</div>
        </div>
        <div>
          <div className="text-muted-foreground uppercase tracking-wider text-[10px]">ТТН</div>
          <div className="text-foreground">{trip.waybill?.ttnNumber ?? '—'}</div>
        </div>
        <div>
          <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Дата</div>
          <div className="text-foreground">{new Date(trip.assignedAt).toLocaleDateString('ru-RU')}</div>
        </div>
      </div>
    </Card>
  );
}

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
        mobileCardRenderer={renderTripCard}
      />
    </div>
  );
}
