import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { Toaster } from 'sonner';
import { useUnit } from 'effector-react';
import { queryClient } from '@/shared/api/query-client';
import { $isDriver } from '@/entities/session/model';
import { ThemeProvider } from '@/shared/lib/theme';
import { router } from './router';

export function Providers() {
  const isDriver = useUnit($isDriver);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster
          position={isDriver ? 'bottom-center' : 'top-right'}
          richColors
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
