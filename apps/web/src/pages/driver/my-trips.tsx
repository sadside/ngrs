import { ArrowsClockwise, Truck } from '@phosphor-icons/react';
import { Button } from '@/shared/ui/button';
import { useMyTrips } from '@/entities/trip/api';
import { DriverTripCard } from '@/widgets/driver-trip-card/ui';

export function MyTripsPage() {
  const { data: trips, isLoading, refetch, isRefetching } = useMyTrips();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Мои рейсы</h1>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="size-10"
        >
          <ArrowsClockwise
            size={22}
            className={isRefetching ? 'animate-spin' : ''}
          />
        </Button>
      </div>

      {isLoading && (
        <p className="py-12 text-center text-lg text-muted-foreground">
          Загрузка...
        </p>
      )}

      {!isLoading && (!trips || trips.length === 0) && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Truck size={64} />
          <p className="text-lg">Нет назначенных рейсов</p>
        </div>
      )}

      {trips && trips.length > 0 && (
        <div className="space-y-4">
          {trips.map((trip) => (
            <DriverTripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}
