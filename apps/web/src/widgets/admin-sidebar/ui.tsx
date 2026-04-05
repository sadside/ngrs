import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import {
  Gauge, Truck, FileText, Users, Car, Buildings, MapPin, Package, UserGear,
  CaretLeft, CaretRight, SignOut,
} from '@phosphor-icons/react';
import { useUnit } from 'effector-react';
import { cn } from '@/shared/lib/utils';
import { $isAdmin, sessionCleared } from '@/entities/session/model';
import { ThemeToggle } from '@/shared/ui/theme-toggle';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/shared/ui/sheet';

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

interface AdminSidebarContentProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  /** Forces always-expanded layout regardless of collapsed state (used in drawer) */
  forceExpanded?: boolean;
  showCollapseToggle?: boolean;
  onToggleCollapse?: () => void;
}

export function AdminSidebarContent({
  collapsed = false,
  onNavigate,
  forceExpanded = false,
  showCollapseToggle = false,
  onToggleCollapse,
}: AdminSidebarContentProps) {
  const isAdmin = useUnit($isAdmin);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionCleared();
    onNavigate?.();
    navigate({ to: '/login' });
  };

  const items = isAdmin ? [...MAIN_NAV, ...ADMIN_NAV] : MAIN_NAV;

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const expanded = forceExpanded || !collapsed;

  return (
    <>
      {/* Logo + optional collapse toggle */}
      <div className={cn('flex items-center p-4', expanded ? 'justify-between' : 'justify-center')}>
        <Link to="/" className="flex items-center gap-2" onClick={onNavigate}>
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
            I
          </div>
          {expanded && <span className="font-bold text-foreground text-lg">Iridium</span>}
        </Link>
        {expanded && showCollapseToggle && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <CaretLeft size={16} />
          </button>
        )}
      </div>

      {!expanded && showCollapseToggle && onToggleCollapse && (
        <div className="flex justify-center px-2 mb-2">
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <CaretRight size={16} />
          </button>
        </div>
      )}

      {expanded && (
        <div className="px-4 mb-1">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Основное</span>
        </div>
      )}

      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              title={!expanded ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl transition-colors',
                expanded ? 'px-3 py-3 text-base md:text-sm' : 'justify-center px-0 py-2.5',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <item.icon size={20} weight={active ? 'fill' : 'regular'} className="shrink-0" />
              {expanded && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn('p-3 border-t border-border flex flex-col gap-2', !expanded && 'items-center')}>
        <ThemeToggle collapsed={!expanded} />
        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 rounded-xl transition-colors text-destructive hover:bg-destructive/10',
            expanded ? 'px-3 py-3 text-base md:text-sm w-full' : 'justify-center p-2',
          )}
          title={!expanded ? 'Выйти' : undefined}
        >
          <SignOut size={20} className="shrink-0" />
          {expanded && <span className="font-medium">Выйти</span>}
        </button>
      </div>
    </>
  );
}

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col bg-card rounded-2xl m-3 border border-border transition-all duration-300 ease-in-out overflow-hidden shrink-0 sticky top-3 self-start h-[calc(100vh-1.5rem)]',
        collapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      <AdminSidebarContent
        collapsed={collapsed}
        showCollapseToggle
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
    </aside>
  );
}

interface AdminSidebarDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminSidebarDrawer({ open, onOpenChange }: AdminSidebarDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-screen max-w-none p-0 flex flex-col bg-card border-none"
      >
        <SheetTitle className="sr-only">Навигация</SheetTitle>
        <AdminSidebarContent
          forceExpanded
          onNavigate={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
