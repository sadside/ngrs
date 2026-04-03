import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus } from '@phosphor-icons/react';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card } from '@/shared/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
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
    control,
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
      <div className="flex items-center justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary-500 hover:bg-primary-600 text-white">
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
                <Input {...register('brand')} placeholder="КАМАЗ" className="bg-white" />
                {errors.brand && <p className="text-sm text-danger">{errors.brand.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Модель</Label>
                <Input {...register('model')} placeholder="65115" className="bg-white" />
                {errors.model && <p className="text-sm text-danger">{errors.model.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Госномер</Label>
                <Input {...register('licensePlate')} placeholder="А123БВ777" className="bg-white" />
                {errors.licensePlate && <p className="text-sm text-danger">{errors.licensePlate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Прицеп (необязательно)</Label>
                <Input {...register('trailerPlate')} placeholder="АА1234 77" className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label>Тип владения</Label>
                <Controller
                  name="ownershipType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Выберите..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(OWNERSHIP_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.ownershipType && <p className="text-sm text-danger">{errors.ownershipType.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Водитель (необязательно)</Label>
                <Controller
                  name="assignedDriverId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)}>
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Не назначен" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Не назначен</SelectItem>
                        {drivers?.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
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
        <Card className="bg-white rounded-xl shadow-sm border border-secondary-100">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary-50 hover:bg-secondary-50">
                <TableHead className="text-secondary-500 font-medium text-xs uppercase tracking-wider">Марка/Модель</TableHead>
                <TableHead className="text-secondary-500 font-medium text-xs uppercase tracking-wider">Госномер</TableHead>
                <TableHead className="text-secondary-500 font-medium text-xs uppercase tracking-wider">Прицеп</TableHead>
                <TableHead className="text-secondary-500 font-medium text-xs uppercase tracking-wider">Водитель</TableHead>
                <TableHead className="text-secondary-500 font-medium text-xs uppercase tracking-wider">Тип владения</TableHead>
                <TableHead className="text-secondary-500 font-medium text-xs uppercase tracking-wider">Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles?.map((v) => (
                <TableRow key={v.id} className="hover:bg-secondary-50/50">
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
        </Card>
      )}
    </div>
  );
}
