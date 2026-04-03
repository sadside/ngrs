import { useState } from 'react';
import { useTrips } from '@/entities/trip/api';
import { TripStatusBadge } from '@/entities/trip/ui';
import { TRIP_STATUS_LABELS } from '@/shared/config/constants';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/shared/ui/table';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/shared/ui/select';

import { Input } from '@/shared/ui/input';
import { CreateTripDialog } from '@/features/create-trip/ui';

export function TripsTable() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const { data: trips, isLoading } = useTrips(
    statusFilter ? { status: statusFilter } : undefined,
  );

  const filtered = trips?.filter((trip) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      trip.driver.fullName.toLowerCase().includes(q) ||
      trip.route.senderContractor.name.toLowerCase().includes(q) ||
      trip.route.receiverContractor.name.toLowerCase().includes(q) ||
      trip.vehicle.licensePlate.toLowerCase().includes(q) ||
      trip.cargo.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col flex-1 gap-4">
      <div className="flex items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value === '__all__' ? '' : value)}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Все статусы</SelectItem>
            {Object.entries(TRIP_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Поиск..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />

        <div className="flex-1" />

        <CreateTripDialog />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground py-8 text-center text-sm">Загрузка...</p>
      ) : !filtered?.length ? (
        <p className="text-muted-foreground py-8 text-center text-sm">Рейсы не найдены</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Водитель</TableHead>
              <TableHead>Маршрут</TableHead>
              <TableHead>ТС</TableHead>
              <TableHead>Груз</TableHead>
              <TableHead>ТТН</TableHead>
              <TableHead>Дата</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((trip, i) => (
              <TableRow key={trip.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>
                  <TripStatusBadge status={trip.status} />
                </TableCell>
                <TableCell>{trip.driver.fullName}</TableCell>
                <TableCell>
                  {trip.route.senderContractor.name} → {trip.route.receiverContractor.name}
                </TableCell>
                <TableCell>{trip.vehicle.licensePlate}</TableCell>
                <TableCell>{trip.cargo.name}</TableCell>
                <TableCell>{trip.waybill?.ttnNumber ?? '—'}</TableCell>
                <TableCell>
                  {new Date(trip.assignedAt).toLocaleDateString('ru-RU')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
