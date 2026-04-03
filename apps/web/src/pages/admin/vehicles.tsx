import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus } from '@phosphor-icons/react';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { OWNERSHIP_LABELS } from '@/shared/config/constants';
import { useVehicles, useCreateVehicle } from '@/entities/vehicle/api';
import { useUsers } from '@/entities/user/api';
import { useCargos } from '@/entities/cargo/api';

const vehicleSchema = z.object({
  brand: z.string().min(1, 'Обязательное поле'),
  model: z.string().min(1, 'Обязательное поле'),
  licensePlate: z.string().min(1, 'Обязательное поле'),
  trailerPlate: z.string().optional(),
  ownershipType: z.string().min(1, 'Выберите тип владения'),
  assignedDriverId: z.string().optional(),
  allowedCargoIds: z.array(z.string()).optional(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

export function VehiclesPage() {
  const { data: vehicles, isLoading } = useVehicles();
  const { data: drivers } = useUsers({ role: 'DRIVER' });
  const { data: cargos } = useCargos();
  const createVehicle = useCreateVehicle();
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: { allowedCargoIds: [] },
  });

  const selectedCargos = watch('allowedCargoIds') ?? [];

  const onSubmit = (data: VehicleFormValues) => {
    const body = {
      ...data,
      trailerPlate: data.trailerPlate || null,
      assignedDriverId: data.assignedDriverId || null,
      allowedCargoIds: data.allowedCargoIds?.length ? data.allowedCargoIds : undefined,
    };
    createVehicle.mutate(body, {
      onSuccess: () => {
        toast.success('Транспорт добавлен');
        setDialogOpen(false);
        reset();
      },
      onError: () => toast.error('Ошибка при создании'),
    });
  };

  const toggleCargo = (cargoId: string) => {
    const current = selectedCargos;
    if (current.includes(cargoId)) {
      setValue('allowedCargoIds', current.filter((id) => id !== cargoId));
    } else {
      setValue('allowedCargoIds', [...current, cargoId]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Транспорт</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={18} className="mr-2" /> Добавить
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новое транспортное средство</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Марка</Label>
                <Input {...register('brand')} placeholder="КАМАЗ" />
                {errors.brand && <p className="text-sm text-danger">{errors.brand.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Модель</Label>
                <Input {...register('model')} placeholder="65115" />
                {errors.model && <p className="text-sm text-danger">{errors.model.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Госномер</Label>
                <Input {...register('licensePlate')} placeholder="А123БВ777" />
                {errors.licensePlate && <p className="text-sm text-danger">{errors.licensePlate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Прицеп (необязательно)</Label>
                <Input {...register('trailerPlate')} placeholder="АА1234 77" />
              </div>
              <div className="space-y-2">
                <Label>Тип владения</Label>
                <select
                  {...register('ownershipType')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Выберите...</option>
                  {Object.entries(OWNERSHIP_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {errors.ownershipType && <p className="text-sm text-danger">{errors.ownershipType.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Водитель (необязательно)</Label>
                <select
                  {...register('assignedDriverId')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Не назначен</option>
                  {drivers?.map((d) => (
                    <option key={d.id} value={d.id}>{d.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Разрешённые грузы</Label>
                <div className="flex flex-wrap gap-2">
                  {cargos?.map((cargo) => (
                    <label key={cargo.id} className="flex items-center gap-1.5 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedCargos.includes(cargo.id)}
                        onChange={() => toggleCargo(cargo.id)}
                        className="rounded border-input"
                      />
                      {cargo.name}
                    </label>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createVehicle.isPending}>
                {createVehicle.isPending ? 'Создание...' : 'Создать'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Марка/Модель</TableHead>
              <TableHead>Госномер</TableHead>
              <TableHead>Прицеп</TableHead>
              <TableHead>Водитель</TableHead>
              <TableHead>Тип владения</TableHead>
              <TableHead>Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles?.map((v) => (
              <TableRow key={v.id}>
                <TableCell>{v.brand} {v.model}</TableCell>
                <TableCell>{v.licensePlate}</TableCell>
                <TableCell>{v.trailerPlate ?? '—'}</TableCell>
                <TableCell>{v.assignedDriver?.fullName ?? '—'}</TableCell>
                <TableCell>{OWNERSHIP_LABELS[v.ownershipType] ?? v.ownershipType}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{v.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {vehicles?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
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
