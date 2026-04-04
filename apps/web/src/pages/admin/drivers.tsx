import { Badge } from '@/shared/ui/badge';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { USER_STATUS_LABELS } from '@/shared/config/constants';
import { useUsers } from '@/entities/user/api';
import { useVehicles } from '@/entities/vehicle/api';

export function DriversPage() {
  const { data: drivers, isLoading } = useUsers({ role: 'DRIVER' });
  const { data: vehicles } = useVehicles();

  const vehicleByDriver = new Map(
    vehicles
      ?.filter((v) => v.assignedDriver)
      .map((v) => [v.assignedDriver!.id, `${v.brand} ${v.model} (${v.licensePlate})`])
  );

  const statusVariant: Record<string, 'success' | 'warning' | 'danger'> = {
    ACTIVE: 'success',
    PENDING: 'warning',
    BLOCKED: 'danger',
  };

  return (
    <div className="flex flex-col flex-1 gap-4">
      {isLoading ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ФИО</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Привязанное ТС</TableHead>
              <TableHead>Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers?.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.fullName}</TableCell>
                <TableCell>{d.phone ?? '—'}</TableCell>
                <TableCell>{vehicleByDriver.get(d.id) ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[d.status] ?? 'neutral'}>
                    {USER_STATUS_LABELS[d.status] ?? d.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {drivers?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Нет данных
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
