import { ArrowsClockwise, Truck } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs';
import { api } from '@/shared/api/client';
import type { Trip } from '@/entities/trip/api';
import { DriverTripCard } from '@/widgets/driver-trip-card/ui';

const ACTIVE_STATUSES = [
  'ASSIGNED',
  'EN_ROUTE_TO_LOADING',
  'LOADING',
  'EN_ROUTE_TO_UNLOADING',
  'UNLOADING',
];

export function MyTripsPage() {
  const {
    data: trips,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['trips', 'my'],
    queryFn: async () => {
      const { data } = await api.get<Trip[]>('/trips/my');
      return data;
    },
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  const activeTrips = trips?.filter((t) => ACTIVE_STATUSES.includes(t.status)) ?? [];
  const historyTrips = trips?.filter((t) => !ACTIVE_STATUSES.includes(t.status)) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Мои рейсы</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="gap-2"
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

      {!isLoading && (
        <Tabs defaultValue="active">
          <TabsList className="w-full">
            <TabsTrigger value="active" className="flex-1">
              Активные ({activeTrips.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              История ({historyTrips.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeTrips.length > 0 ? (
              <div className="space-y-3">
                {activeTrips.map((trip) => (
                  <DriverTripCard key={trip.id} trip={trip} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-12 bg-card rounded-xl border border-border min-h-[400px]">
                <div className="p-4 rounded-2xl bg-muted">
                  <Truck size={40} weight="light" className="text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-base font-medium text-foreground">Нет активных рейсов</p>
                  <p className="text-sm text-muted-foreground mt-1">Ожидайте назначения от логиста<br />или свяжитесь с диспетчером</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {historyTrips.length > 0 ? (
              <div className="space-y-3">
                {historyTrips.map((trip) => (
                  <DriverTripCard
                    key={trip.id}
                    trip={trip}
                    className="opacity-75"
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-12 bg-card rounded-xl border border-border min-h-[400px]">
                <div className="p-4 rounded-2xl bg-muted">
                  <Truck size={40} weight="light" className="text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-base font-medium text-foreground">Нет завершённых рейсов</p>
                  <p className="text-sm text-muted-foreground mt-1">Здесь будет история ваших рейсов</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
