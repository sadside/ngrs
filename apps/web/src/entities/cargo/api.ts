import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

export interface Cargo {
  id: string;
  name: string;
  technicalSpec: string | null;
  unCode: string | null;
  hazardClass: string | null;
  packagingMethod: string | null;
}

export function useCargos() {
  return useQuery({
    queryKey: ['cargos'],
    queryFn: async () => {
      const { data } = await api.get<Cargo[]>('/cargos');
      return data;
    },
  });
}

export function useCreateCargo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => {
      const { data } = await api.post('/cargos', body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cargos'] }),
  });
}

export function useUpdateCargo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string } & Record<string, any>) => {
      const { data } = await api.patch(`/cargos/${id}`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cargos'] }),
  });
}
