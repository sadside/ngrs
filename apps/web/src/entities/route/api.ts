import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

export interface Route {
  id: string;
  loadingAddress: string;
  unloadingAddress: string;
  description: string | null;
  senderContractor: { id: string; name: string; inn: string | null };
  receiverContractor: { id: string; name: string; inn: string | null };
}

export function useRoutes() {
  return useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const { data } = await api.get<Route[]>('/routes');
      return data;
    },
  });
}

export function useCreateRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => {
      const { data } = await api.post('/routes', body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routes'] }),
  });
}

export function useUpdateRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string } & Record<string, any>) => {
      const { data } = await api.patch(`/routes/${id}`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routes'] }),
  });
}
