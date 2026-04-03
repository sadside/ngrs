import { Badge } from '@/shared/ui/badge';
import { Card } from '@/shared/ui/card';
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

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    BLOCKED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : (
        <Card className="bg-white rounded-xl shadow-sm border border-secondary-100">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary-50 hover:bg-secondary-50">
                <TableHead className="text-secondary-500 font-medium text-xs uppercase tracking-wider">ФИО</TableHead>
                <TableHead className="text-secondary-500 font-medium text-xs uppercase tracking-wider">Телефон</TableHead>
                <TableHead className="text-secondary-500 font-medium text-xs uppercase tracking-wider">Привязанное ТС</TableHead>
                <TableHead className="text-secondary-500 font-medium text-xs uppercase tracking-wider">Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers?.map((d) => (
                <TableRow key={d.id} className="hover:bg-secondary-50/50">
                  <TableCell>{d.fullName}</TableCell>
                  <TableCell>{d.phone ?? '—'}</TableCell>
                  <TableCell>{vehicleByDriver.get(d.id) ?? '—'}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[d.status] ?? ''}>
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
        </Card>
      )}
    </div>
  );
}
