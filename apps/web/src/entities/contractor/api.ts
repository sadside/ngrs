import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

export interface Contractor {
  id: string;
  name: string;
  inn: string | null;
  legalAddress: string | null;
  actualAddress: string | null;
  type: string;
  contactPhone: string | null;
  contactPerson: string | null;
}

export function useContractors(type?: string) {
  return useQuery({
    queryKey: ['contractors', type],
    queryFn: async () => {
      const params = type ? `?type=${type}` : '';
      const { data } = await api.get<Contractor[]>(`/contractors${params}`);
      return data;
    },
  });
}

export function useCreateContractor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => {
      const { data } = await api.post('/contractors', body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contractors'] }),
  });
}

export function useUpdateContractor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string } & Record<string, any>) => {
      const { data } = await api.patch(`/contractors/${id}`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contractors'] }),
  });
}
