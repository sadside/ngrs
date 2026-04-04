import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';

interface CreateTripForm {
  routeId: string;
  driverId: string;
  vehicleId: string;
  cargoId: string;
}

interface CreateTripDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateTripDialog({ open: controlledOpen, onOpenChange }: CreateTripDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const { data: routes } = useRoutes();
  const { data: drivers } = useUsers({ role: 'DRIVER', status: 'ACTIVE' });
  const { data: vehicles } = useVehicles('ACTIVE');
  const { data: cargos } = useCargos();

  const createTrip = useCreateTrip();

  const {
    handleSubmit,
    reset,
    control,
    formState: { isSubmitting, errors },
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
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button>Создать рейс</Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый рейс</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label>Маршрут</Label>
            <Controller
              name="routeId"
              control={control}
              rules={{ required: 'Обязательное поле' }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите маршрут" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes?.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.senderContractor.name} → {r.receiverContractor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.routeId && <p className="text-sm text-destructive">{errors.routeId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Водитель</Label>
            <Controller
              name="driverId"
              control={control}
              rules={{ required: 'Обязательное поле' }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите водителя" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.driverId && <p className="text-sm text-destructive">{errors.driverId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Транспортное средство</Label>
            <Controller
              name="vehicleId"
              control={control}
              rules={{ required: 'Обязательное поле' }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите ТС" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles?.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.brand} {v.licensePlate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.vehicleId && <p className="text-sm text-destructive">{errors.vehicleId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Груз</Label>
            <Controller
              name="cargoId"
              control={control}
              rules={{ required: 'Обязательное поле' }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите груз" />
                  </SelectTrigger>
                  <SelectContent>
                    {cargos?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.cargoId && <p className="text-sm text-destructive">{errors.cargoId.message}</p>}
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
