import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

export interface Waybill {
  id: string;
  ttnNumber: string;
  weight: number;
  loadWeight: number;
  driverFullName: string;
  photoUrl: string | null;
  submittedAt: string;
  submittedOffline: boolean;
  trip: {
    id: string;
    status: string;
    route: {
      loadingAddress: string;
      unloadingAddress: string;
      senderContractor: { id: string; name: string };
      receiverContractor: { id: string; name: string };
    };
    driver: { id: string; fullName: string };
    vehicle: { id: string; licensePlate: string };
    cargo: { id: string; name: string };
  };
}

interface WaybillFilters {
  ttnNumber?: string;
  driverId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useWaybills(filters?: WaybillFilters) {
  return useQuery({
    queryKey: ['waybills', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.ttnNumber) params.set('ttnNumber', filters.ttnNumber);
      if (filters?.driverId) params.set('driverId', filters.driverId);
      if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.set('dateTo', filters.dateTo);
      const { data } = await api.get<Waybill[]>(`/waybills?${params}`);
      return data;
    },
  });
}

export function useCreateWaybill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      tripId: string;
      ttnNumber: string;
      weight: number;
      loadWeight: number;
      driverFullName: string;
      submittedOffline?: boolean;
    }) => {
      const { data } = await api.post<Waybill>('/waybills', body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['waybills'] });
      qc.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}
