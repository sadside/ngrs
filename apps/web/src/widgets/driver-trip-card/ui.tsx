import { useNavigate } from '@tanstack/react-router';
import {
  MapPin,
  Truck,
  Package,
  ArrowRight,
  ClipboardText,
  Path,
} from '@phosphor-icons/react';
import { TripStatusBadge } from '@/entities/trip/ui';
import { getTripStatusColor } from '@/entities/trip/lib';
import type { Trip } from '@/entities/trip/api';
import { cn } from '@/shared/lib/utils';

interface DriverTripCardProps {
  trip: Trip;
}

const STATUS_ICON: Record<string, typeof Truck> = {
  ASSIGNED: ClipboardText,
  EN_ROUTE_TO_LOADING: Truck,
  LOADING: Package,
  EN_ROUTE_TO_UNLOADING: Truck,
  UNLOADING: Package,
  COMPLETED: ClipboardText,
};

const STATUS_ICON_BG: Record<string, string> = {
  ASSIGNED: 'bg-secondary-100',
  EN_ROUTE_TO_LOADING: 'bg-accent-50',
  LOADING: 'bg-primary-50',
  EN_ROUTE_TO_UNLOADING: 'bg-accent-50',
  UNLOADING: 'bg-primary-50',
  COMPLETED: 'bg-green-50',
};

const STATUS_ICON_COLOR: Record<string, string> = {
  ASSIGNED: 'text-secondary-500',
  EN_ROUTE_TO_LOADING: 'text-accent-500',
  LOADING: 'text-primary-500',
  EN_ROUTE_TO_UNLOADING: 'text-accent-500',
  UNLOADING: 'text-primary-500',
  COMPLETED: 'text-green-600',
};

export function DriverTripCard({ trip }: DriverTripCardProps) {
  const navigate = useNavigate();
  const Icon = STATUS_ICON[trip.status] ?? Truck;

  return (
    <div
      className="bg-white rounded-xl border border-border shadow-sm cursor-pointer active:scale-[0.98] transition-all hover:shadow-md overflow-hidden"
      onClick={() =>
        navigate({
          to: '/driver/trip/$tripId',
          params: { tripId: trip.id },
        })
      }
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-border">
        <div
          className={cn(
            'p-2 rounded-lg shrink-0',
            STATUS_ICON_BG[trip.status],
          )}
        >
          <Icon
            size={22}
            weight="duotone"
            className={STATUS_ICON_COLOR[trip.status]}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-secondary-900 truncate">
            {trip.route.senderContractor.name} &rarr;{' '}
            {trip.route.receiverContractor.name}
          </p>
          <p className="text-sm text-secondary-400">
            {trip.cargo.name} &middot; {trip.vehicle.licensePlate}
          </p>
        </div>
        <TripStatusBadge status={trip.status} />
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-start gap-2">
          <MapPin
            size={18}
            weight="fill"
            className="mt-0.5 shrink-0 text-green-500"
          />
          <p className="text-sm text-secondary-700 leading-snug">
            {trip.route.loadingAddress}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <MapPin
            size={18}
            weight="fill"
            className="mt-0.5 shrink-0 text-red-400"
          />
          <p className="text-sm text-secondary-700 leading-snug">
            {trip.route.unloadingAddress}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-secondary-50 flex items-center justify-between">
        <span className="text-xs text-secondary-400">
          {new Date(trip.assignedAt).toLocaleDateString('ru-RU')}
        </span>
        <ArrowRight size={16} className="text-secondary-300" />
      </div>
    </div>
  );
}
