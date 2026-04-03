import { useState, useEffect } from 'react';

import { useWaybills, type Waybill } from '@/entities/waybill/api';
import { Input } from '@/shared/ui/input';
import { Card } from '@/shared/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/shared/ui/table';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function WaybillsTable() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: waybills, isLoading } = useWaybills(
    debouncedSearch ? { ttnNumber: debouncedSearch } : undefined,
  );

  return (
    <div className="space-y-4">
      <Input
        placeholder="Поиск по № ТТН..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm bg-white"
      />

      <Card className="bg-white rounded-xl shadow-sm border border-secondary-100">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary-50 hover:bg-secondary-50">
              <TableHead className="text-secondary-500 font-medium text-xs uppercase tracking-wider">№ ТТН</TableHead>
              <TableHead className="text-secondary-500 font-medium text-xs uppercase tracking-wider">Водитель</TableHead>
              <TableHead className="text-secondary-500 font-medium text-xs uppercase tracking-wider">Вес, тн</TableHead>
              <TableHead className="text-secondary-500 font-medium text-xs uppercase tracking-wider">Вес налива, тн</TableHead>
              <TableHead className="text-secondary-500 font-medium text-xs uppercase tracking-wider">Маршрут</TableHead>
              <TableHead className="text-secondary-500 font-medium text-xs uppercase tracking-wider">ТС</TableHead>
              <TableHead className="text-secondary-500 font-medium text-xs uppercase tracking-wider">Дата</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Загрузка...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && (!waybills || waybills.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Накладные не найдены
                </TableCell>
              </TableRow>
            )}
            {waybills?.map((wb: Waybill) => (
              <TableRow key={wb.id} className="hover:bg-secondary-50/50">
                <TableCell className="font-bold">{wb.ttnNumber}</TableCell>
                <TableCell>{wb.driverFullName}</TableCell>
                <TableCell>{wb.weight}</TableCell>
                <TableCell>{wb.loadWeight}</TableCell>
                <TableCell>
                  {wb.trip.route.senderContractor.name} &rarr;{' '}
                  {wb.trip.route.receiverContractor.name}
                </TableCell>
                <TableCell>{wb.trip.vehicle.licensePlate}</TableCell>
                <TableCell>{formatDate(wb.submittedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
