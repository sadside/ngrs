import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, MapPin, Truck, Package, FileText, CheckCircle } from '@phosphor-icons/react';
import { Button } from '@/shared/ui/button';
import { TripStatusBadge } from '@/entities/trip/ui';
import { useTrip } from '@/entities/trip/api';
import { StatusButtons } from '@/features/update-trip-status/ui';
import { SubmitWaybillForm } from '@/features/submit-waybill/ui';

export function ActiveTripPage() {
  const { tripId } = useParams({ from: '/driver/trip/$tripId' });
  const navigate = useNavigate();
  const { data: trip, isLoading } = useTrip(tripId);

  if (isLoading) {
    return <p className="py-12 text-center text-muted-foreground">Загрузка...</p>;
  }

  if (!trip) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-card"
          onClick={() => navigate({ to: '/driver' })}
        >
          <ArrowLeft size={16} />
          Назад
        </Button>
        <p className="py-12 text-center text-muted-foreground">Рейс не найден</p>
      </div>
    );
  }

  const showWaybillForm =
    !trip.waybill && trip.status !== 'COMPLETED' && trip.status !== 'CANCELLED';

  return (
    <div className="space-y-4">
      {/* Back + Status */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-card"
          onClick={() => navigate({ to: '/driver' })}
        >
          <ArrowLeft size={16} />
          Назад
        </Button>
        <TripStatusBadge status={trip.status} />
      </div>

      {/* Route card */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="font-semibold text-foreground">
            {trip.route.senderContractor.name} &rarr; {trip.route.receiverContractor.name}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {trip.cargo.name} &middot; {trip.vehicle.licensePlate}
          </p>
        </div>
        <div className="px-4 py-3 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <MapPin size={18} weight="fill" className="mt-0.5 shrink-0 text-accent" />
            <div>
              <p className="text-xs text-muted-foreground">Погрузка</p>
              <p className="text-sm text-foreground">{trip.route.loadingAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <MapPin size={18} weight="fill" className="mt-0.5 shrink-0 text-destructive" />
            <div>
              <p className="text-xs text-muted-foreground">Выгрузка</p>
              <p className="text-sm text-foreground">{trip.route.unloadingAddress}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status actions */}
      {trip.status !== 'LOADING' && trip.status !== 'COMPLETED' && (
        <StatusButtons tripId={trip.id} status={trip.status} />
      )}

      {/* Waybill form */}
      {showWaybillForm && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={20} className="text-primary" weight="duotone" />
            <h3 className="font-semibold text-foreground">Данные накладной</h3>
          </div>
          <SubmitWaybillForm
            tripId={trip.id}
            driverFullName={trip.driver.fullName}
          />
        </div>
      )}

      {/* Waybill summary */}
      {trip.waybill && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <CheckCircle size={20} className="text-accent" weight="duotone" />
            <h3 className="font-semibold text-foreground">Накладная отправлена</h3>
          </div>
          <div className="px-4 py-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">ТТН</p>
              <p className="font-medium text-foreground">{trip.waybill.ttnNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ФИО</p>
              <p className="font-medium text-foreground">{trip.waybill.driverFullName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Вес</p>
              <p className="font-medium text-foreground">{trip.waybill.weight} тн</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Вес налива</p>
              <p className="font-medium text-foreground">{trip.waybill.loadWeight} тн</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
