import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

export interface Trip {
  id: string;
  status: string;
  assignedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  route: {
    id: string;
    loadingAddress: string;
    unloadingAddress: string;
    senderContractor: { id: string; name: string };
    receiverContractor: { id: string; name: string };
  };
  driver: { id: string; fullName: string; phone: string | null };
  vehicle: { id: string; brand: string; model: string; licensePlate: string };
  cargo: { id: string; name: string };
  waybill: {
    id: string;
    ttnNumber: string;
    weight: number;
    loadWeight: number;
    driverFullName: string;
    submittedAt: string;
  } | null;
}

interface TripFilters {
  status?: string;
  driverId?: string;
  routeId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useTrips(filters?: TripFilters) {
  return useQuery({
    queryKey: ['trips', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.driverId) params.set('driverId', filters.driverId);
      if (filters?.routeId) params.set('routeId', filters.routeId);
      if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.set('dateTo', filters.dateTo);
      const { data } = await api.get<Trip[]>(`/trips?${params}`);
      return data;
    },
  });
}

export function useMyTrips() {
  return useQuery({
    queryKey: ['trips', 'my'],
    queryFn: async () => {
      const { data } = await api.get<Trip[]>('/trips/my');
      return data;
    },
  });
}

export function useTrip(id: string) {
  return useQuery({
    queryKey: ['trips', id],
    queryFn: async () => {
      const { data } = await api.get<Trip>(`/trips/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { routeId: string; driverId: string; vehicleId: string; cargoId: string }) => {
      const { data } = await api.post<Trip>('/trips', body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trips'] }),
  });
}

export function useUpdateTripStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch<Trip>(`/trips/${id}/status`, { status });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trips'] }),
  });
}
