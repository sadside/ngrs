# Redesign V2 — Layout + Dashboard (Plan 2/3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current header+sidebar layout with a new Rayum-inspired layout: collapsible rounded sidebar with ThemeToggle, no header bar (user popover in content area), redesigned dashboard with donut chart and alerts widget.

**Architecture:** Sidebar is a self-contained widget with collapse state in localStorage. UserPopover replaces AdminHeader. Dashboard gets 2 new widgets (donut, alerts). ECharts for all charts.

**Tech Stack:** React, TanStack Router, Effector (session), Phosphor Icons, ECharts, shadcn components with new variants.

---

## File Structure

```
apps/web/src/
├── app/
│   └── layouts/
│       └── admin-layout.tsx           # REWRITE — new layout without header
├── widgets/
│   ├── admin-sidebar/
│   │   └── ui.tsx                     # REWRITE — collapsible, rounded, theme toggle
│   ├── admin-header/
│   │   └── ui.tsx                     # DELETE — replaced by UserPopover in content
│   ├── dashboard-stats/
│   │   └── ui.tsx                     # MODIFY — use Card variants
│   └── page-header/
│       └── ui.tsx                     # NEW — page title + UserPopover row
├── pages/
│   └── admin/
│       └── dashboard.tsx              # MODIFY — add donut chart, alerts widget, page header
```

---

### Task 1: New Collapsible Sidebar

**Files:**
- Rewrite: `apps/web/src/widgets/admin-sidebar/ui.tsx`

- [ ] **Step 1: Rewrite sidebar with collapse support**

The sidebar should:
- Be `bg-card rounded-2xl m-3` (separated from content by margin)
- Width: `w-64` expanded → `w-[72px]` collapsed with `transition-all duration-300 ease-in-out`
- Logo: "Iridium" expanded, "I" collapsed — both clickable to `/`
- Collapse button: `CaretLeft`/`CaretRight` icon next to logo
- Nav items: icon + text expanded, icon-only collapsed with tooltip
- Sections: "Основное" label (hidden when collapsed) for main nav, "Управление" for admin-only items
- Active item: `bg-primary text-primary-foreground rounded-xl`
- Inactive: `text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl`
- Bottom: ThemeToggle component (collapsed prop when sidebar collapsed)
- State stored in localStorage key `iridium-sidebar-collapsed`

```tsx
// apps/web/src/widgets/admin-sidebar/ui.tsx
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
```

- [ ] **Step 2: Verify build**

```bash
pnpm --filter @iridium/web run build
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/widgets/admin-sidebar/
git commit -m "feat: new collapsible sidebar with rounded design, theme toggle, collapse state"
```

---

### Task 2: Page Header Widget + Remove AdminHeader

**Files:**
- Create: `apps/web/src/widgets/page-header/ui.tsx`
- Delete content of: `apps/web/src/widgets/admin-header/ui.tsx` (or remove file)
- Modify: `apps/web/src/app/layouts/admin-layout.tsx`

- [ ] **Step 1: Create PageHeader widget**

```tsx
// apps/web/src/widgets/page-header/ui.tsx
import { UserPopover } from '@/shared/ui/user-popover';

interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <UserPopover />
    </div>
  );
}
```

- [ ] **Step 2: Update AdminLayout — remove header, simplify**

```tsx
// apps/web/src/app/layouts/admin-layout.tsx
import { Outlet } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AdminSidebar } from '@/widgets/admin-sidebar/ui';
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
      <main className="flex-1 flex flex-col overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
```

No AdminHeader imported — it's replaced by PageHeader used inside each page.

- [ ] **Step 3: Delete or empty AdminHeader**

Replace `apps/web/src/widgets/admin-header/ui.tsx` with empty export:

```tsx
// This file is deprecated — use PageHeader + UserPopover instead
export {};
```

- [ ] **Step 4: Add PageHeader to all admin pages**

Each admin page needs `<PageHeader title="..." />` at the top. Add to:

- `dashboard.tsx`: title="Добрый день, {user.fullName}", description="Вот сводка за сегодня"
- `trips.tsx`: title="Рейсы"
- `waybills.tsx`: title="Накладные"
- `drivers.tsx`: title="Водители"
- `vehicles.tsx`: title="Транспорт"
- `contractors.tsx`: title="Контрагенты"
- `routes.tsx`: title="Маршруты"
- `cargos.tsx`: title="Грузы"
- `users.tsx`: title="Пользователи"

For dashboard, use user from Effector:
```tsx
import { useUnit } from 'effector-react';
import { $user } from '@/entities/session/model';

const user = useUnit($user);
const greeting = getGreeting(); // "Добрый день" / "Доброе утро" / "Добрый вечер"

<PageHeader
  title={`${greeting}, ${user?.fullName ?? ''}`}
  description="Вот сводка за сегодня"
/>
```

Helper function:
```tsx
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
}
```

For other pages — just static title.

- [ ] **Step 5: Commit**

```bash
git add apps/web/
git commit -m "feat: add PageHeader with UserPopover, remove AdminHeader, update all pages"
```

---

### Task 3: Dashboard — Donut Chart + Alerts Widget

**Files:**
- Modify: `apps/web/src/pages/admin/dashboard.tsx`

- [ ] **Step 1: Add donut chart for trip status distribution**

Add a third row section with donut chart. Use ECharts pie chart:

```tsx
const donutOption = useMemo(() => {
  const statusCounts = [
    { name: 'Назначен', value: trips?.filter(t => t.status === 'ASSIGNED').length ?? 0, color: '#606E80' },
    { name: 'В пути', value: trips?.filter(t => ['EN_ROUTE_TO_LOADING', 'EN_ROUTE_TO_UNLOADING'].includes(t.status)).length ?? 0, color: '#3765F6' },
    { name: 'На погрузке/выгрузке', value: trips?.filter(t => ['LOADING', 'UNLOADING'].includes(t.status)).length ?? 0, color: '#F59E0B' },
    { name: 'Завершён', value: trips?.filter(t => t.status === 'COMPLETED').length ?? 0, color: '#70FC8E' },
    { name: 'Отменён', value: trips?.filter(t => t.status === 'CANCELLED').length ?? 0, color: '#EF4444' },
  ].filter(s => s.value > 0);

  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['55%', '80%'],
      center: ['50%', '50%'],
      itemStyle: { borderRadius: 6, borderColor: 'transparent', borderWidth: 2 },
      label: { show: false },
      data: statusCounts.map(s => ({ name: s.name, value: s.value, itemStyle: { color: s.color } })),
    }],
  };
}, [trips]);
```

Import `PieChart` from echarts:
```tsx
import { BarChart, LineChart, PieChart } from 'echarts/charts';
echarts.use([BarChart, LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);
```

- [ ] **Step 2: Add alerts widget — trips without waybill > 2h**

```tsx
const alertTrips = useMemo(() => {
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  return (trips ?? []).filter(t =>
    t.status !== 'ASSIGNED' &&
    t.status !== 'COMPLETED' &&
    t.status !== 'CANCELLED' &&
    !t.waybill &&
    new Date(t.assignedAt).getTime() < twoHoursAgo
  );
}, [trips]);
```

Widget:
```tsx
<div className="bg-card rounded-xl border border-border">
  <div className="px-5 py-3 border-b border-border flex items-center gap-2">
    <Warning size={18} className="text-warning" weight="duotone" />
    <h3 className="font-semibold text-foreground">Требуют внимания</h3>
    {alertTrips.length > 0 && (
      <Badge variant="warning" size="sm">{alertTrips.length}</Badge>
    )}
  </div>
  {alertTrips.length === 0 ? (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className="p-3 rounded-2xl bg-accent/10">
        <CheckCircle size={28} weight="light" className="text-accent" />
      </div>
      <p className="text-sm text-muted-foreground">Все накладные отправлены вовремя</p>
    </div>
  ) : (
    <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
      {alertTrips.map(trip => (
        <div key={trip.id} className="px-4 py-3 flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-warning/10 mt-0.5">
            <Warning size={16} className="text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {trip.route.senderContractor.name} → {trip.route.receiverContractor.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {trip.driver.fullName} · {Math.round((Date.now() - new Date(trip.assignedAt).getTime()) / 3600000)}ч назад
            </p>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
```

Import `Warning` from `@phosphor-icons/react`.

- [ ] **Step 3: Update Row 3 layout**

Change Row 3 from `grid-cols-3` to include donut and alerts:

```tsx
{/* Row 3: Recent trips + Donut + Alerts */}
<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
  {/* Recent trips — 2 cols */}
  <div className="lg:col-span-2 bg-card rounded-xl border border-border">
    {/* existing recent trips table */}
  </div>

  {/* Donut chart — 1 col */}
  <div className="bg-card rounded-xl border border-border p-5">
    <h3 className="font-semibold text-foreground mb-2">Статусы рейсов</h3>
    <ReactEChartsCore echarts={echarts} option={donutOption} style={{ height: 200 }} />
  </div>

  {/* Alerts — 1 col */}
  {/* alerts widget from above */}
</div>
```

Move "Последние накладные" to a new Row 4 or merge into Row 3. Simplest: put waybills below charts in Row 2.5 or keep as separate row. Up to you — make it look balanced.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/admin/dashboard.tsx
git commit -m "feat: add donut chart for trip statuses and alerts widget to dashboard"
```

---

### Task 4: Final Build Verification

- [ ] **Step 1: Build**

```bash
pnpm --filter @iridium/shared run build && pnpm --filter @iridium/web run build
```

- [ ] **Step 2: Visual check**

Start dev server, verify:
1. Sidebar collapses/expands with animation
2. Theme toggle works (dark ↔ light)
3. UserPopover shows user info with logout
4. Dashboard shows all widgets including donut and alerts
5. Pages have PageHeader with title

- [ ] **Step 3: Commit any fixes**

```bash
git add .
git commit -m "fix: layout and dashboard polish"
```
