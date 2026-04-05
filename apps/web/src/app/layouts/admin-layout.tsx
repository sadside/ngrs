import { useState, useEffect } from 'react';
import { Outlet } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { List } from '@phosphor-icons/react';
import { AdminSidebar, AdminSidebarDrawer } from '@/widgets/admin-sidebar/ui';
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

  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <AdminSidebarDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden p-4 md:p-6 min-w-0">
        {/* Mobile header: hamburger + brand */}
        <header className="md:hidden flex items-center gap-3 mb-4 pb-3 border-b border-border">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-muted text-foreground transition-colors"
            aria-label="Открыть меню"
          >
            <List size={24} weight="bold" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              I
            </div>
            <span className="font-bold text-foreground">Iridium</span>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
