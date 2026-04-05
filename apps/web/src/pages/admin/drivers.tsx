import { useMemo } from 'react';
import type { ColumnDef, Row } from '@tanstack/react-table';

import { PageHeader } from '@/widgets/page-header/ui';
import { Card } from '@/shared/ui/card';
import { DataTable, getSelectColumn } from '@/shared/ui/data-table';
import { DataTableColumnHeader } from '@/shared/ui/data-table/column-header';
import { Badge } from '@/shared/ui/badge';
import { USER_STATUS_LABELS } from '@/shared/config/constants';
import { useUsers, type User } from '@/entities/user/api';
import { useVehicles } from '@/entities/vehicle/api';

const statusVariant: Record<string, 'success' | 'warning' | 'danger'> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  BLOCKED: 'danger',
};

export function DriversPage() {
  const { data: drivers, isLoading } = useUsers({ role: 'DRIVER' });
  const { data: vehicles } = useVehicles();

  const vehicleByDriver = useMemo(
    () =>
      new Map(
        vehicles
          ?.filter((v) => v.assignedDriver)
          .map((v) => [v.assignedDriver!.id, `${v.brand} ${v.model} (${v.licensePlate})`]),
      ),
    [vehicles],
  );

  const columns = useMemo<ColumnDef<User, any>[]>(() => [
    getSelectColumn<User>(),
    {
      accessorKey: 'fullName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ФИО" />,
    },
    {
      accessorKey: 'phone',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Телефон" />,
      cell: ({ row }) => row.original.phone ?? '—',
    },
    {
      id: 'vehicle',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Привязанное ТС" />,
      accessorFn: (row) => vehicleByDriver.get(row.id) ?? '',
      cell: ({ row }) => vehicleByDriver.get(row.original.id) ?? '—',
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Статус" />,
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.status] ?? 'neutral'}>
          {USER_STATUS_LABELS[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
  ], [vehicleByDriver]);

  const mobileCardRenderer = (row: Row<User>) => {
    const driver = row.original;
    const vehicle = vehicleByDriver.get(driver.id);
    return (
      <Card className="p-4 gap-2">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground truncate">{driver.fullName}</div>
            <div className="text-sm text-muted-foreground truncate">{driver.phone ?? '—'}</div>
          </div>
          <Badge variant={statusVariant[driver.status] ?? 'neutral'}>
            {USER_STATUS_LABELS[driver.status] ?? driver.status}
          </Badge>
        </div>
        {vehicle && (
          <div className="text-xs">
            <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Привязанное ТС</div>
            <div className="text-foreground">{vehicle}</div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <PageHeader title="Водители" />

      <DataTable
        columns={columns}
        data={drivers ?? []}
        isLoading={isLoading}
        searchPlaceholder="Поиск водителей..."
        mobileCardRenderer={mobileCardRenderer}
      />
    </div>
  );
}
