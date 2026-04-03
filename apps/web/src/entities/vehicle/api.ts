import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  licensePlate: string;
  trailerPlate: string | null;
  capacity: number | null;
  volumeCapacity: number | null;
  ownershipType: string;
  status: string;
  assignedDriver: { id: string; fullName: string } | null;
  allowedCargos: Array<{ cargo: { id: string; name: string } }>;
}

export function useVehicles(status?: string) {
  return useQuery({
    queryKey: ['vehicles', status],
    queryFn: async () => {
      const params = status ? `?status=${status}` : '';
      const { data } = await api.get<Vehicle[]>(`/vehicles${params}`);
      return data;
    },
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => {
      const { data } = await api.post('/vehicles', body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string } & Record<string, any>) => {
      const { data } = await api.patch(`/vehicles/${id}`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });
}
