import { CheckCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { useUpdateTripStatus } from '@/entities/trip/api';

interface StatusButtonsProps {
  tripId: string;
  status: string;
}

const STATUS_ACTIONS: Record<string, { label: string; nextStatus: string }> = {
  ASSIGNED: { label: 'Начать рейс', nextStatus: 'EN_ROUTE_TO_LOADING' },
  EN_ROUTE_TO_LOADING: { label: 'Прибыл на погрузку', nextStatus: 'LOADING' },
  EN_ROUTE_TO_UNLOADING: { label: 'Прибыл на выгрузку', nextStatus: 'UNLOADING' },
  UNLOADING: { label: 'Завершить рейс', nextStatus: 'COMPLETED' },
};

export function StatusButtons({ tripId, status }: StatusButtonsProps) {
  const updateStatus = useUpdateTripStatus();
  const action = STATUS_ACTIONS[status];

  if (status === 'COMPLETED') {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 p-4 text-green-700">
        <CheckCircle size={28} weight="fill" />
        <span className="text-lg font-semibold">Рейс завершён</span>
      </div>
    );
  }

  if (!action) {
    return null;
  }

  const handleClick = async () => {
    try {
      await updateStatus.mutateAsync({ id: tripId, status: action.nextStatus });
      toast.success('Статус обновлён');
    } catch {
      toast.error('Не удалось обновить статус');
    }
  };

  return (
    <Button
      className="h-14 w-full rounded-xl bg-primary-500 text-lg font-semibold text-white hover:bg-primary-600"
      onClick={handleClick}
      disabled={updateStatus.isPending}
    >
      {updateStatus.isPending ? 'Обновление...' : action.label}
    </Button>
  );
}
