import type { ColumnDef } from '@tanstack/react-table';

import { PageHeader } from '@/widgets/page-header/ui';
import { DataTable, getSelectColumn } from '@/shared/ui/data-table';
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

  const vehicleByDriver = new Map(
    vehicles
      ?.filter((v) => v.assignedDriver)
      .map((v) => [v.assignedDriver!.id, `${v.brand} ${v.model} (${v.licensePlate})`]),
  );

  const columns: ColumnDef<User, any>[] = [
    getSelectColumn<User>(),
    {
      accessorKey: 'fullName',
      header: 'ФИО',
    },
    {
      accessorKey: 'phone',
      header: 'Телефон',
      cell: ({ row }) => row.original.phone ?? '—',
    },
    {
      id: 'vehicle',
      header: 'Привязанное ТС',
      cell: ({ row }) => vehicleByDriver.get(row.original.id) ?? '—',
    },
    {
      accessorKey: 'status',
      header: 'Статус',
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.status] ?? 'neutral'}>
          {USER_STATUS_LABELS[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col flex-1">
      <PageHeader title="Водители" />

      <DataTable
        columns={columns}
        data={drivers ?? []}
        isLoading={isLoading}
        searchPlaceholder="Поиск водителей..."
      />
    </div>
  );
}
