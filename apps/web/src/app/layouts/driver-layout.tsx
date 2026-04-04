import { Outlet, useNavigate } from '@tanstack/react-router';
import { SignOut } from '@phosphor-icons/react';
import { useUnit } from 'effector-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { Button } from '@/shared/ui/button';
import { $user, sessionSet, sessionCleared } from '@/entities/session/model';
import { getMeFn } from '@/entities/session/api';
import { sseModel } from '@/features/sse-notifications/model';

export function DriverLayout() {
  const user = useUnit($user);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.add('light');
    return () => {
      const stored = localStorage.getItem('iridium-theme');
      if (stored !== 'light') {
        document.documentElement.classList.remove('light');
      }
    };
  }, []);

  const { data } = useQuery({
    queryKey: ['session', 'me'],
    queryFn: getMeFn,
  });

  useEffect(() => {
    if (data) sessionSet(data);
  }, [data]);

  useEffect(() => {
    sseModel.connect();
    return () => sseModel.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-secondary-50">
      <header className="bg-white border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary-500">Iridium</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-secondary-700">{user?.fullName}</span>
          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer text-secondary-400 hover:text-secondary-700"
            onClick={() => {
              sessionCleared();
              navigate({ to: '/login' });
            }}
          >
            <SignOut size={20} />
          </Button>
        </div>
      </header>
      <main className="p-4 max-w-2xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
