import { useNavigate } from '@tanstack/react-router';
import { MapPin, Truck, Package } from '@phosphor-icons/react';
import { Card, CardContent } from '@/shared/ui/card';
import { TripStatusBadge } from '@/entities/trip/ui';
import type { Trip } from '@/entities/trip/api';

interface DriverTripCardProps {
  trip: Trip;
}

export function DriverTripCard({ trip }: DriverTripCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer active:scale-[0.98] transition-transform"
      onClick={() => navigate({ to: '/driver/trip/$tripId', params: { tripId: trip.id } })}
    >
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-lg font-semibold leading-tight">
            {trip.route.senderContractor.name} &rarr; {trip.route.receiverContractor.name}
          </p>
          <TripStatusBadge status={trip.status} />
        </div>

        <div className="space-y-3 text-base">
          <div className="flex items-start gap-3">
            <MapPin size={22} weight="fill" className="mt-0.5 shrink-0 text-green-600" />
            <div>
              <span className="text-sm text-muted-foreground">Погрузка</span>
              <p className="text-lg leading-snug">{trip.route.loadingAddress}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin size={22} weight="fill" className="mt-0.5 shrink-0 text-red-600" />
            <div>
              <span className="text-sm text-muted-foreground">Выгрузка</span>
              <p className="text-lg leading-snug">{trip.route.unloadingAddress}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Package size={22} className="mt-0.5 shrink-0 text-muted-foreground" />
            <p className="text-lg">{trip.cargo.name}</p>
          </div>

          <div className="flex items-start gap-3">
            <Truck size={22} className="mt-0.5 shrink-0 text-muted-foreground" />
            <p className="text-lg">{trip.vehicle.licensePlate}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
