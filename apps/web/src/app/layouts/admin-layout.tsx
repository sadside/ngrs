import { Outlet } from '@tanstack/react-router';

export function AdminLayout() {
  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 border-r border-secondary-100 bg-white p-4">
        <div className="text-xl font-bold text-primary-500 mb-8">Iridium</div>
        <nav className="text-sm text-secondary-700">
          <p className="py-2">Sidebar placeholder</p>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
