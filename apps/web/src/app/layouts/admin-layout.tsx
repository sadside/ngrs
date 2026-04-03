import { Outlet } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { AdminSidebar } from '@/widgets/admin-sidebar/ui';
import { AdminHeader } from '@/widgets/admin-header/ui';
import { getMeFn } from '@/entities/session/api';
import { sessionSet } from '@/entities/session/model';

export function AdminLayout() {
  const { data: user } = useQuery({
    queryKey: ['session', 'me'],
    queryFn: getMeFn,
  });

  useEffect(() => {
    if (user) sessionSet(user);
  }, [user]);

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
