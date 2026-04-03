import { Outlet } from '@tanstack/react-router';

export function DriverLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary-500 text-white p-4 text-center">
        <h1 className="text-lg font-bold">Iridium</h1>
      </header>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );
}
