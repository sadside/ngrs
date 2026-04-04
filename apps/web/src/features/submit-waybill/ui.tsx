import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { IMaskInput } from 'react-imask';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Button } from '@/shared/ui/button';
import { useCreateWaybill } from '@/entities/waybill/api';

interface WaybillFormValues {
  driverFullName: string;
  ttnNumber: string;
  weight: string;
  loadWeight: string;
}

interface SubmitWaybillFormProps {
  tripId: string;
  driverFullName?: string;
}

export function SubmitWaybillForm({ tripId, driverFullName }: SubmitWaybillFormProps) {
  const createWaybill = useCreateWaybill();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<WaybillFormValues>({
    defaultValues: {
      driverFullName: driverFullName ?? '',
      ttnNumber: '',
      weight: '',
      loadWeight: '',
    },
  });

  const onSubmit = async (data: WaybillFormValues) => {
    try {
      await createWaybill.mutateAsync({
        tripId,
        ttnNumber: data.ttnNumber,
        weight: parseFloat(data.weight),
        loadWeight: parseFloat(data.loadWeight),
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
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">ФИО водителя</Label>
        <Input
          {...register('driverFullName', { required: 'Введите ФИО' })}
          className="h-12 text-base"
          placeholder="Иванов Иван Иванович"
        />
        {errors.driverFullName && (
          <p className="text-sm text-danger">{errors.driverFullName.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Номер ТТН</Label>
        <Controller
          name="ttnNumber"
          control={control}
          rules={{ required: 'Введите номер ТТН' }}
          render={({ field }) => (
            <IMaskInput
              mask="000-0000000"
              value={field.value}
              onAccept={(value: string) => field.onChange(value)}
              placeholder="___-_______"
              className="flex h-12 w-full rounded-md border border-input bg-white px-3 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          )}
        />
        {errors.ttnNumber && (
          <p className="text-sm text-danger">{errors.ttnNumber.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Вес (тн)</Label>
          <Input
            {...register('weight', {
              required: 'Введите вес',
              validate: (v) => parseFloat(v) > 0 || 'Введите корректный вес',
            })}
            type="number"
            step="0.01"
            className="h-12 text-base"
            placeholder="0.00"
            inputMode="decimal"
          />
          {errors.weight && (
            <p className="text-sm text-danger">{errors.weight.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Вес налива (тн)</Label>
          <Input
            {...register('loadWeight', {
              required: 'Введите вес налива',
              validate: (v) => parseFloat(v) > 0 || 'Введите корректный вес',
            })}
            type="number"
            step="0.01"
            className="h-12 text-base"
            placeholder="0.00"
            inputMode="decimal"
          />
          {errors.loadWeight && (
            <p className="text-sm text-danger">{errors.loadWeight.message}</p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full rounded-xl font-semibold"
        disabled={createWaybill.isPending}
      >
        {createWaybill.isPending ? 'Отправка...' : 'Отправить накладную'}
      </Button>
    </form>
  );
}
