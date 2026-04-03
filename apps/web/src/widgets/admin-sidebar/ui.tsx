import { Link, useLocation } from '@tanstack/react-router';
import {
  Gauge,
  Truck,
  FileText,
  Users,
  Car,
  Buildings,
  MapPin,
  Package,
  UserGear,
} from '@phosphor-icons/react';
import { useUnit } from 'effector-react';

import { cn } from '@/shared/lib/utils';
import { $isAdmin } from '@/entities/session/model';

const NAV_ITEMS = [
  { to: '/' as const, label: 'Дашборд', icon: Gauge },
  { to: '/trips' as const, label: 'Рейсы', icon: Truck },
  { to: '/waybills' as const, label: 'Накладные', icon: FileText },
  { to: '/drivers' as const, label: 'Водители', icon: Users },
  { to: '/vehicles' as const, label: 'Транспорт', icon: Car },
  { to: '/contractors' as const, label: 'Контрагенты', icon: Buildings },
  { to: '/routes' as const, label: 'Маршруты', icon: MapPin },
  { to: '/cargos' as const, label: 'Грузы', icon: Package },
];

const ADMIN_ITEMS = [
  { to: '/users' as const, label: 'Пользователи', icon: UserGear },
];

export function AdminSidebar() {
  const isAdmin = useUnit($isAdmin);
  const location = useLocation();

  const items = isAdmin ? [...NAV_ITEMS, ...ADMIN_ITEMS] : NAV_ITEMS;

  return (
    <aside className="w-64 border-r border-secondary-100 bg-white flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary-500">Iridium</h1>
        <p className="text-xs text-muted mt-1">Управление перевозками</p>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {items.map((item) => {
          const isActive =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900',
              )}
            >
              <item.icon size={20} weight={isActive ? 'fill' : 'regular'} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
