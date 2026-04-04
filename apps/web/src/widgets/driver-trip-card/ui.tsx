import { useNavigate } from '@tanstack/react-router';
import {
  MapPin,
  Truck,
  Package,
  ClipboardText,
} from '@phosphor-icons/react';
import { TripStatusBadge } from '@/entities/trip/ui';
import { Button } from '@/shared/ui/button';
import type { Trip } from '@/entities/trip/api';
import { cn } from '@/shared/lib/utils';

interface DriverTripCardProps {
  trip: Trip;
  className?: string;
}

const STATUS_ICON: Record<string, typeof Truck> = {
  ASSIGNED: ClipboardText,
  EN_ROUTE_TO_LOADING: Truck,
  LOADING: Package,
  EN_ROUTE_TO_UNLOADING: Truck,
  UNLOADING: Package,
  COMPLETED: ClipboardText,
};

function getMainAction(trip: Trip) {
  switch (trip.status) {
    case 'ASSIGNED':
      return <Button size="sm">Начать рейс</Button>;
    case 'EN_ROUTE_TO_LOADING':
    case 'LOADING':
      return trip.waybill ? (
        <Button size="sm" variant="outline">Подробнее</Button>
      ) : (
        <Button size="sm">Отправить накладную</Button>
      );
    case 'EN_ROUTE_TO_UNLOADING':
    case 'UNLOADING':
      return trip.waybill ? (
        <Button size="sm" variant="outline">Подробнее</Button>
      ) : (
        <Button size="sm" variant="outline">Завершить</Button>
      );
    case 'COMPLETED':
      return <span className="text-xs text-accent">Завершён</span>;
    case 'CANCELLED':
      return <span className="text-xs text-destructive">Отменён</span>;
    default:
      return null;
  }
}

export function DriverTripCard({ trip, className }: DriverTripCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'bg-card rounded-xl border border-border shadow-sm cursor-pointer active:scale-[0.98] transition-all hover:shadow-md overflow-hidden',
        className,
      )}
      onClick={() =>
        navigate({
          to: '/driver/trip/$tripId',
          params: { tripId: trip.id },
        })
      }
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Откуда</p>
            <p className="font-semibold text-foreground">{trip.route.senderContractor.name}</p>
          </div>
          <TripStatusBadge status={trip.status} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Куда</p>
          <p className="font-semibold text-foreground">{trip.route.receiverContractor.name}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {trip.cargo.name} &middot; {trip.vehicle.licensePlate}
        </p>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-start gap-2">
          <MapPin
            size={18}
            weight="fill"
            className="mt-0.5 shrink-0 text-accent"
          />
          <p className="text-sm text-foreground leading-snug">
            {trip.route.loadingAddress}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <MapPin
            size={18}
            weight="fill"
            className="mt-0.5 shrink-0 text-destructive"
          />
          <p className="text-sm text-foreground leading-snug">
            {trip.route.unloadingAddress}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-muted flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {new Date(trip.assignedAt).toLocaleDateString('ru-RU')}
        </span>
        {getMainAction(trip)}
      </div>
    </div>
  );
}
