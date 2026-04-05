import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

export interface LinkTokenResponse {
  token: string;
  deepLink: string;
  expiresAt: string;
}

export function useGenerateLinkToken() {
  return useMutation({
    mutationFn: async (): Promise<LinkTokenResponse> => {
      const res = await api.post<LinkTokenResponse>('/telegram-bot/link-token');
      return res.data;
    },
  });
}

export function useUnlinkTelegram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      await api.delete('/telegram-bot/link');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session', 'me'] }),
  });
}
