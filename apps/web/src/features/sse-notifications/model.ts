import { sample, createEffect } from 'effector';
import { toast } from 'sonner';

import { createSSEConnection } from '@/shared/lib/sse-factory';
import { queryClient } from '@/shared/api/query-client';
import { getAccessToken } from '@/shared/lib/auth';

const sse = createSSEConnection({
  url: '/api/notifications/sse',
  getToken: getAccessToken,
});

const handleEventFx = createEffect((msg: MessageEvent) => {
  try {
    const event = JSON.parse(msg.data);

    if (event.type === 'waybill-submitted') {
      queryClient.invalidateQueries({ queryKey: ['waybills'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast.info(
        `Накладная ТТН ${event.data?.ttnNumber} от ${event.data?.driverName}`,
      );
    }

    if (event.type === 'trip-status-changed') {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    }
  } catch {
    // ignore parse errors
  }
});

sample({
  clock: sse.messageReceived,
  target: handleEventFx,
});

export const sseModel = {
  connect: sse.connect,
  disconnect: sse.disconnect,
  $state: sse.$state,
};
