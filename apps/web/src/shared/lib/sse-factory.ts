import {
  createEvent,
  createStore,
  createEffect,
  attach,
  sample,
  createApi,
} from 'effector';
import { readonly } from 'patronum';

type ConnectionState = 'closed' | 'connecting' | 'opened';

interface SSEFactoryParams {
  url: string;
  getToken: () => string | null;
}

export function createSSEConnection({ url, getToken }: SSEFactoryParams) {
  const connect = createEvent();
  const disconnect = createEvent();

  const $instance = createStore<EventSource | null>(null, {
    serialize: 'ignore',
  });
  const $state = createStore<ConnectionState>('closed');

  const stateApi = createApi($state, {
    open: () => 'opened' as const,
    close: () => 'closed' as const,
    connecting: () => 'connecting' as const,
  });

  const messageReceived = createEvent<MessageEvent>();
  const errorOccurred = createEvent();

  const connectFx = attach({
    source: $instance,
    effect: createEffect(
      ({ instance }: { instance: EventSource | null }) => {
        if (instance) instance.close();

        const token = getToken();
        if (!token) return null;

        const es = new EventSource(`${url}?token=${token}`);

        stateApi.connecting();

        es.addEventListener('waybill-submitted', (e) => messageReceived(e));
        es.addEventListener('trip-status-changed', (e) => messageReceived(e));

        es.onopen = () => stateApi.open();
        es.onerror = () => errorOccurred();

        return es;
      },
    ),
    mapParams: (_: void, instance) => ({ instance }),
  });

  const disconnectFx = attach({
    source: $instance,
    effect: (instance: EventSource | null) => {
      if (instance) instance.close();
      return null;
    },
  });

  sample({ clock: connect, target: connectFx });
  sample({ clock: connectFx.doneData, filter: Boolean, target: $instance });
  sample({ clock: [disconnect, errorOccurred], target: disconnectFx });
  sample({ clock: disconnectFx.done, target: [$instance.reinit, stateApi.close] });

  return {
    connect,
    disconnect,
    $state: readonly($state),
    messageReceived: readonly(messageReceived),
    errorOccurred: readonly(errorOccurred),
  };
}
