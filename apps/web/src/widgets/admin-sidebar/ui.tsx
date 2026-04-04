import { useState, useEffect } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  Gauge, Truck, FileText, Users, Car, Buildings, MapPin, Package, UserGear,
  CaretLeft, CaretRight,
} from '@phosphor-icons/react';
import { useUnit } from 'effector-react';
import { cn } from '@/shared/lib/utils';
import { $isAdmin } from '@/entities/session/model';
import { ThemeToggle } from '@/shared/ui/theme-toggle';

const STORAGE_KEY = 'iridium-sidebar-collapsed';

const MAIN_NAV = [
  { to: '/', label: 'Дашборд', icon: Gauge },
  { to: '/trips', label: 'Рейсы', icon: Truck },
  { to: '/waybills', label: 'Накладные', icon: FileText },
  { to: '/drivers', label: 'Водители', icon: Users },
  { to: '/vehicles', label: 'Транспорт', icon: Car },
  { to: '/contractors', label: 'Контрагенты', icon: Buildings },
  { to: '/routes', label: 'Маршруты', icon: MapPin },
  { to: '/cargos', label: 'Грузы', icon: Package },
];

const ADMIN_NAV = [
  { to: '/users', label: 'Пользователи', icon: UserGear },
];

export function AdminSidebar() {
  const isAdmin = useUnit($isAdmin);
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  const items = isAdmin ? [...MAIN_NAV, ...ADMIN_NAV] : MAIN_NAV;

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <aside
      className={cn(
        'flex flex-col bg-card rounded-2xl m-3 border border-border transition-all duration-300 ease-in-out overflow-hidden shrink-0',
        collapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      {/* Logo + Collapse */}
      <div className={cn('flex items-center p-4', collapsed ? 'justify-center' : 'justify-between')}>
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
            I
          </div>
          {!collapsed && <span className="font-bold text-foreground text-lg">Iridium</span>}
        </Link>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <CaretLeft size={16} />
          </button>
        )}
      </div>

      {collapsed && (
        <div className="flex justify-center px-2 mb-2">
          <button
            onClick={() => setCollapsed(false)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <CaretRight size={16} />
          </button>
        </div>
      )}

      {/* Section label */}
      {!collapsed && (
        <div className="px-4 mb-1">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Основное</span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl transition-colors',
                collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <item.icon size={20} weight={active ? 'fill' : 'regular'} className="shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Theme toggle */}
      <div className={cn('p-3 border-t border-border', collapsed && 'flex justify-center')}>
        <ThemeToggle collapsed={collapsed} />
      </div>
    </aside>
  );
}
