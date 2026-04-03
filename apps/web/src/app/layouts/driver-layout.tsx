import { Outlet, useNavigate } from '@tanstack/react-router';
import { SignOut } from '@phosphor-icons/react';
import { useUnit } from 'effector-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { Button } from '@/shared/ui/button';
import { $user, sessionSet, sessionCleared } from '@/entities/session/model';
import { getMeFn } from '@/entities/session/api';

export function DriverLayout() {
  const user = useUnit($user);
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['session', 'me'],
    queryFn: getMeFn,
  });

  useEffect(() => {
    if (data) sessionSet(data);
  }, [data]);

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between bg-primary-500 p-4 text-white">
        <h1 className="text-lg font-bold">Iridium</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm">{user?.fullName}</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-primary-600"
            onClick={() => {
              sessionCleared();
              navigate({ to: '/login' });
            }}
          >
            <SignOut size={20} />
          </Button>
        </div>
      </header>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );
}
