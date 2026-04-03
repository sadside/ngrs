import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useCreateTrip } from '@/entities/trip/api';
import { useRoutes } from '@/entities/route/api';
import { useUsers } from '@/entities/user/api';
import { useVehicles } from '@/entities/vehicle/api';
import { useCargos } from '@/entities/cargo/api';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';

interface CreateTripForm {
  routeId: string;
  driverId: string;
  vehicleId: string;
  cargoId: string;
}

export function CreateTripDialog() {
  const [open, setOpen] = useState(false);

  const { data: routes } = useRoutes();
  const { data: drivers } = useUsers({ role: 'DRIVER', status: 'ACTIVE' });
  const { data: vehicles } = useVehicles('ACTIVE');
  const { data: cargos } = useCargos();

  const createTrip = useCreateTrip();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CreateTripForm>();

  const onSubmit = async (data: CreateTripForm) => {
    try {
      await createTrip.mutateAsync(data);
      toast.success('Рейс успешно создан');
      reset();
      setOpen(false);
    } catch {
      toast.error('Не удалось создать рейс');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Создать рейс</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый рейс</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Маршрут</Label>
            <select
              {...register('routeId', { required: true })}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              defaultValue=""
            >
              <option value="" disabled>
                Выберите маршрут
              </option>
              {routes?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.senderContractor.name} → {r.receiverContractor.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Водитель</Label>
            <select
              {...register('driverId', { required: true })}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              defaultValue=""
            >
              <option value="" disabled>
                Выберите водителя
              </option>
              {drivers?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Транспортное средство</Label>
            <select
              {...register('vehicleId', { required: true })}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              defaultValue=""
            >
              <option value="" disabled>
                Выберите ТС
              </option>
              {vehicles?.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.licensePlate}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Груз</Label>
            <select
              {...register('cargoId', { required: true })}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              defaultValue=""
            >
              <option value="" disabled>
                Выберите груз
              </option>
              {cargos?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Создание...' : 'Создать'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
