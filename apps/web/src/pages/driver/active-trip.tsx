import { useParams } from '@tanstack/react-router';

export function ActiveTripPage() {
  const { tripId } = useParams({ from: '/driver/trip/$tripId' });

  return (
    <div>
      <h1 className="text-2xl font-bold">Активный рейс</h1>
      <p className="mt-2 text-secondary-600">ID рейса: {tripId}</p>
    </div>
  );
}
