import { ArrowsClockwise, Truck } from '@phosphor-icons/react';
import { Button } from '@/shared/ui/button';
import { useMyTrips } from '@/entities/trip/api';
import { DriverTripCard } from '@/widgets/driver-trip-card/ui';

export function MyTripsPage() {
  const { data: trips, isLoading, refetch, isRefetching } = useMyTrips();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-secondary-900">Мои рейсы</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="cursor-pointer gap-2"
        >
          <ArrowsClockwise
            size={16}
            className={isRefetching ? 'animate-spin' : ''}
          />
          Обновить
        </Button>
      </div>

      {isLoading && (
        <p className="py-12 text-center text-muted-foreground">Загрузка...</p>
      )}

      {!isLoading && (!trips || trips.length === 0) && (
        <div className="flex flex-col items-center gap-3 py-16 text-secondary-300">
          <Truck size={64} weight="duotone" />
          <p className="text-lg text-secondary-400">Нет назначенных рейсов</p>
        </div>
      )}

      {trips && trips.length > 0 && (
        <div className="space-y-3">
          {trips.map((trip) => (
            <DriverTripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}
