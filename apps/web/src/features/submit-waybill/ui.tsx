import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Button } from '@/shared/ui/button';
import { useCreateWaybill } from '@/entities/waybill/api';

const waybillSchema = z.object({
  driverFullName: z.string().min(1, 'Обязательное поле'),
  ttnNumber: z.string().min(1, 'Обязательное поле'),
  weight: z.coerce.number().positive('Введите корректный вес'),
  loadWeight: z.coerce.number().positive('Введите корректный вес'),
});

type WaybillFormValues = z.infer<typeof waybillSchema>;

interface SubmitWaybillFormProps {
  tripId: string;
  driverFullName?: string;
}

export function SubmitWaybillForm({ tripId, driverFullName }: SubmitWaybillFormProps) {
  const createWaybill = useCreateWaybill();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WaybillFormValues>({
    resolver: zodResolver(waybillSchema),
    defaultValues: {
      driverFullName: driverFullName ?? '',
      ttnNumber: '',
      weight: undefined,
      loadWeight: undefined,
    },
  });

  const onSubmit = async (data: WaybillFormValues) => {
    try {
      await createWaybill.mutateAsync({
        tripId,
        ttnNumber: data.ttnNumber,
        weight: data.weight,
        loadWeight: data.loadWeight,
        driverFullName: data.driverFullName,
      });
      toast.success('Накладная отправлена');
      reset();
    } catch {
      toast.error('Не удалось отправить накладную');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <h3 className="text-lg font-semibold">Накладная</h3>

      <div className="space-y-1.5">
        <Label className="text-base">ФИО водителя</Label>
        <Input
          {...register('driverFullName')}
          className="h-14 text-lg"
          placeholder="Иванов Иван Иванович"
        />
        {errors.driverFullName && (
          <p className="text-sm text-destructive">{errors.driverFullName.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-base">Номер ТТН</Label>
        <Input
          {...register('ttnNumber')}
          className="h-14 text-lg"
          placeholder="000-0000000"
        />
        {errors.ttnNumber && (
          <p className="text-sm text-destructive">{errors.ttnNumber.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-base">Вес (тн)</Label>
        <Input
          {...register('weight')}
          type="number"
          step="0.01"
          className="h-14 text-lg"
          placeholder="0.00"
          inputMode="decimal"
        />
        {errors.weight && (
          <p className="text-sm text-destructive">{errors.weight.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-base">Вес налива (тн)</Label>
        <Input
          {...register('loadWeight')}
          type="number"
          step="0.01"
          className="h-14 text-lg"
          placeholder="0.00"
          inputMode="decimal"
        />
        {errors.loadWeight && (
          <p className="text-sm text-destructive">{errors.loadWeight.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="h-14 w-full rounded-xl bg-primary-500 text-lg font-bold text-white hover:bg-primary-600"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Отправка...' : 'Отправить накладную'}
      </Button>
    </form>
  );
}
