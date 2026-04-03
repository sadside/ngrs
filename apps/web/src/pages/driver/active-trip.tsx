import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, MapPin, Truck, Package } from '@phosphor-icons/react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { TripStatusBadge } from '@/entities/trip/ui';
import { useTrip } from '@/entities/trip/api';
import { StatusButtons } from '@/features/update-trip-status/ui';
import { SubmitWaybillForm } from '@/features/submit-waybill/ui';

export function ActiveTripPage() {
  const { tripId } = useParams({ from: '/driver/trip/$tripId' });
  const navigate = useNavigate();
  const { data: trip, isLoading } = useTrip(tripId);

  if (isLoading) {
    return (
      <p className="py-12 text-center text-lg text-muted-foreground">
        Загрузка...
      </p>
    );
  }

  if (!trip) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          className="gap-2 text-base"
          onClick={() => navigate({ to: '/driver' })}
        >
          <ArrowLeft size={22} />
          Назад
        </Button>
        <p className="py-12 text-center text-lg text-muted-foreground">
          Рейс не найден
        </p>
      </div>
    );
  }

  const showWaybillForm =
    !trip.waybill &&
    (trip.status === 'LOADING' || trip.status === 'EN_ROUTE_TO_LOADING');

  return (
    <div className="space-y-5">
      <Button
        variant="ghost"
        className="gap-2 text-base"
        onClick={() => navigate({ to: '/driver' })}
      >
        <ArrowLeft size={22} />
        Назад
      </Button>

      {/* Trip info */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-xl font-bold leading-tight">
              {trip.route.senderContractor.name} &rarr;{' '}
              {trip.route.receiverContractor.name}
            </h2>
            <TripStatusBadge status={trip.status} />
          </div>

          <div className="space-y-3">
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

      {/* Status actions */}
      {trip.status !== 'LOADING' && (
        <StatusButtons tripId={trip.id} status={trip.status} />
      )}

      {/* Waybill form */}
      {showWaybillForm && (
        <Card>
          <CardContent>
            <SubmitWaybillForm
              tripId={trip.id}
              driverFullName={trip.driver.fullName}
            />
          </CardContent>
        </Card>
      )}

      {/* Waybill summary */}
      {trip.waybill && (
        <Card>
          <CardContent className="space-y-2">
            <h3 className="text-lg font-semibold">Накладная</h3>
            <div className="space-y-1 text-base">
              <p>
                <span className="text-muted-foreground">ТТН:</span>{' '}
                {trip.waybill.ttnNumber}
              </p>
              <p>
                <span className="text-muted-foreground">ФИО:</span>{' '}
                {trip.waybill.driverFullName}
              </p>
              <p>
                <span className="text-muted-foreground">Вес:</span>{' '}
                {trip.waybill.weight} тн
              </p>
              <p>
                <span className="text-muted-foreground">Вес налива:</span>{' '}
                {trip.waybill.loadWeight} тн
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
