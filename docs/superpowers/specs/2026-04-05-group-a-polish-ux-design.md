# Group A — Polish & UX Design Spec

**Date:** 2026-04-05
**Scope:** Iridium TMS frontend (`apps/web`) polish improvements — mobile auth, table sorting, vehicle statuses, dashboard widget refactor.

## Goal

Four independent improvements bundled as one spec because each is small and touches disjoint files:

1. Auth pages (login, register) adapt to mobile viewports
2. Sortable columns across all admin tables
3. Vehicle `IN_REPAIR` status alongside existing `ACTIVE`/`INACTIVE`
4. Dashboard refactor: extract inline chart/table blocks into standalone widgets wrapped in `Card`

Group A contains no cross-cutting architectural changes. Each section can be implemented and shipped independently if needed.

---

## Section 1 — Auth Pages Mobile Adaptation

### Problem

`LoginForm` and `RegisterForm` (`apps/web/src/features/auth/`) use fixed width `w-[520px]`. At 375px mobile viewport the card overflows horizontally; pages contain no responsive breakpoints.

### Solution

Fluid width with max cap, responsive outer padding, responsive heading size.

**Changes:**

- `features/auth/login-form.tsx`, `features/auth/register-form.tsx`: replace `w-[520px]` with `w-full max-w-[520px]`.
- `pages/auth/login.tsx`, `pages/auth/register.tsx`: outer container gets `px-4 sm:px-6` for edge padding on small screens.
- Headings inside the forms scale down on small viewports: `text-2xl sm:text-3xl` (or equivalent existing token pair).

**Non-goals:**
- No split-screen desktop redesign.
- No full-screen native-app layout on mobile.
- No new media queries — Tailwind responsive prefixes only.

**Files:** 4 files modified, 0 created.

---

## Section 2 — Table Sorting

### Problem

`DataTable` (`apps/web/src/shared/ui/data-table/index.tsx`) does not wire `getSortedRowModel` or `SortingState`. No column in any of the 8 admin pages has a sortable header.

### Solution

Client-side sorting via tanstack, single-column sort, no default sort, new reusable `DataTableColumnHeader` component.

### DataTable changes

In `apps/web/src/shared/ui/data-table/index.tsx`:

- Import `getSortedRowModel`, `type SortingState` from `@tanstack/react-table`.
- Add `const [sorting, setSorting] = useState<SortingState>([]);`.
- Extend `useReactTable` config:
  - `state.sorting: sorting`
  - `onSortingChange: setSorting`
  - `getSortedRowModel: getSortedRowModel()`

No change to `DataTableProps` interface — sorting is internal state, same as current filter/selection.

### New component `DataTableColumnHeader`

Path: `apps/web/src/shared/ui/data-table/column-header.tsx`

**Props:** `{ column: Column<TData, unknown>; title: string; className?: string }`.

**Behavior:**

- If `column.getCanSort()` is false: render plain `<span>{title}</span>`.
- Otherwise: render a button containing the title + a sort-state icon.
  - `sorted === 'asc'` → `ArrowUp` (phosphor)
  - `sorted === 'desc'` → `ArrowDown`
  - `sorted === false` → `ArrowsDownUp` (muted color)
- `onClick` calls `column.toggleSorting(column.getIsSorted() === 'asc')` for the standard off → asc → desc → off cycle that tanstack provides.
- Button uses existing `Button` ghost variant with `size="sm"`, no background, no border — matches current header typography.

### Column def updates

All 8 admin pages update their column defs:

- `pages/admin/cargos.tsx`
- `pages/admin/contractors.tsx`
- `pages/admin/drivers.tsx`
- `pages/admin/routes.tsx`
- `pages/admin/trips.tsx`
- `pages/admin/users.tsx`
- `pages/admin/vehicles.tsx`
- `pages/admin/waybills.tsx`

**For each text / number / date / accessor column:**
```tsx
{
  accessorKey: 'login',
  header: ({ column }) => <DataTableColumnHeader column={column} title="Логин" />,
}
```

**For select column (`getSelectColumn`):** already has `enableSorting: false` — no change.

**For actions column:** add `enableSorting: false` where missing.

**For accessor-function columns** (e.g. `driver` on trips page using `accessorFn`): tanstack sorts by the returned value automatically — no extra config.

### Non-goals

- Server-side sorting.
- Multi-column sort (no shift+click).
- Persisting sort state in URL or localStorage.
- Per-page default sort (backend already returns `createdAt desc` for list endpoints).

---

## Section 3 — Vehicle Statuses (`IN_REPAIR`)

### Problem

Current `VehicleStatus` enum in `apps/api/prisma/schema.prisma` has only `ACTIVE` and `INACTIVE`. Logisticians cannot mark a vehicle as under repair, which conflates "temporarily unavailable" with "retired".

### Solution

Add `IN_REPAIR` as a third enum value. No data migration needed — existing rows keep their values.

### Backend

**File:** `apps/api/prisma/schema.prisma`

```prisma
enum VehicleStatus {
  ACTIVE
  IN_REPAIR
  INACTIVE
}
```

**Migration:** `pnpm prisma migrate dev --name vehicle_status_in_repair`

PostgreSQL enum extension is non-destructive. `UpdateVehicleDto` already accepts `status` — no new endpoint required.

### Frontend constants

**File:** `apps/web/src/shared/config/constants.ts`

```ts
export const VEHICLE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Активна',
  IN_REPAIR: 'На ремонте',
  INACTIVE: 'Неактивна',
};
```

**Badge variant mapping** (used by the vehicles page and any reusable `VehicleStatusBadge`):

| Status      | Badge variant |
|-------------|---------------|
| `ACTIVE`    | `success`     |
| `IN_REPAIR` | `warning`     |
| `INACTIVE`  | `neutral`     |

### Vehicles page

**File:** `apps/web/src/pages/admin/vehicles.tsx`

- Status column renders `<Badge variant={...}>{VEHICLE_STATUS_LABELS[status]}</Badge>`.
- Toolbar gains a status filter built from `VEHICLE_STATUS_LABELS` (same pattern as users page role/status filters).
- Row actions dropdown shows the status-change items conditionally — the current status is hidden so the user only sees meaningful transitions:
  - Current `ACTIVE`: show "Отправить на ремонт", "Деактивировать"
  - Current `IN_REPAIR`: show "Активировать", "Деактивировать"
  - Current `INACTIVE`: show "Активировать", "Отправить на ремонт"
- Each action calls `useUpdateVehicle().mutate({ id, status })` with a success toast.

### Trip creation flow

**File:** `apps/web/src/features/create-trip/*` — vehicle selector.

The vehicle selector filters the fetched list to `status === 'ACTIVE'` before rendering `<SelectItem>`s. Non-active vehicles are not shown at all (not disabled, not dimmed) to keep the list clean.

### Non-goals

- No `DECOMMISSIONED` fourth status.
- No separate `isAvailable` computed flag — status is the single source of truth.
- No history log of status changes (future feature if requested).

---

## Section 4 — Dashboard Widgets Refactor

### Problem

`apps/web/src/pages/admin/dashboard.tsx` is 531 lines with 11 `useMemo` calls. Charts and stat blocks are declared inline using echarts directly in JSX. Most sections use `<div className="bg-card rounded-xl border border-border">` instead of the `Card` component. Only `TripsPerWeek` is extracted as a widget and wrapped in `Card`.

### Solution

Extract each dashboard block into its own widget under `src/widgets/`. Each widget:

1. Is wrapped in `Card` from `@/shared/ui/card` (not hand-rolled div).
2. Fetches its own data via existing hooks (`useTrips`, `useDrivers`, `useWaybills`, etc.) — no props from the page.
3. Handles loading and empty states via two new shared components.

The page becomes a thin layout composing widgets into a grid.

### Target widget list

| Widget                                | Status | Content                                        |
|---------------------------------------|--------|------------------------------------------------|
| `widgets/dashboard-stats`             | exists | 4 KPI cards (one widget, not split)            |
| `widgets/trips-per-week`              | exists | Bar chart — reference implementation           |
| `widgets/trips-by-status`             | new    | Donut chart of trip status distribution        |
| `widgets/top-drivers`                 | new    | List of top drivers by trip count              |
| `widgets/recent-trips`                | new    | Table of recent trips (already has component `trips-table` — adapt) |
| `widgets/recent-waybills`             | new    | Table of recent waybills (already has `waybills-table` — adapt) |

`DashboardStats` stays as a single widget containing all four KPI cards internally — confirmed by user.

Existing `widgets/trips-table` and `widgets/waybills-table` get wrapped with `Card` + loading/empty handling to become `recent-trips` and `recent-waybills` (or kept under current names if they already cover the role — review during implementation and rename only if semantically required).

### Widget file structure

```
widgets/<name>/
  ui.tsx     — React component, wrapped in <Card>, calls data hook internally
  index.ts   — re-exports { <WidgetName> }
  model.ts   — OPTIONAL: heavy aggregation/grouping logic (only if ui.tsx grows past ~80 lines)
```

### Loading and empty state components

Two new components in `apps/web/src/shared/ui/`:

**`widget-skeleton.tsx`**
```ts
interface WidgetSkeletonProps {
  variant: 'chart' | 'table' | 'stats' | 'list';
}
```
Renders shimmer placeholders shaped like the target content:
- `chart` — a large rectangle with faint axis lines
- `table` — header row + 5 body rows of grey bars
- `stats` — 4 small rectangular blocks in a row
- `list` — 5 rows with avatar circle + two text bars

**`widget-empty.tsx`**
```ts
interface WidgetEmptyProps {
  icon: React.ElementType;  // phosphor icon component
  message: string;
}
```
Renders a centered column with the icon (muted color, ~48px) and the message below in `text-sm text-muted-foreground`. Uses `py-10` for vertical spacing so empty state feels intentional, not tiny.

### Widget pattern

Every widget follows this shape. `CardHeader` stays visible during loading (no layout shift); the skeleton/empty state replaces only `CardContent`.

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { WidgetSkeleton } from '@/shared/ui/widget-skeleton';
import { WidgetEmpty } from '@/shared/ui/widget-empty';
import { ChartPie } from '@phosphor-icons/react';
import { useTrips } from '@/entities/trip/api';

export function TripsByStatus() {
  const { data, isLoading } = useTrips();

  const chartData = /* aggregate here or import from ./model */;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Рейсы по статусам</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <WidgetSkeleton variant="chart" />
        ) : !data?.length ? (
          <WidgetEmpty icon={ChartPie} message="Нет данных за период" />
        ) : (
          <DonutChart data={chartData} />
        )}
      </CardContent>
    </Card>
  );
}
```

### Dashboard page after refactor

**File:** `apps/web/src/pages/admin/dashboard.tsx`

Target: ~40 lines, zero `useMemo`, zero inline echarts imports.

```tsx
import { PageHeader } from '@/widgets/page-header/ui';
import { DashboardStats } from '@/widgets/dashboard-stats';
import { TripsPerWeek } from '@/widgets/trips-per-week';
import { TripsByStatus } from '@/widgets/trips-by-status';
import { TopDrivers } from '@/widgets/top-drivers';
import { RecentTrips } from '@/widgets/recent-trips';
import { RecentWaybills } from '@/widgets/recent-waybills';

export function DashboardPage() {
  return (
    <div className="flex flex-col flex-1 gap-6">
      <PageHeader title="Дашборд" />
      <DashboardStats />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TripsPerWeek />
        <TripsByStatus />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopDrivers />
        <RecentTrips />
      </div>
      <RecentWaybills />
    </div>
  );
}
```

### Where the aggregation logic goes

All 11 `useMemo` blocks currently in the dashboard file relocate into the widget that consumes them. A widget's `ui.tsx` may compute the aggregation inline if it is short (≤ 10 lines). If the transformation is heavier (e.g. grouping trips by week with date-fns calls, computing top-N drivers with sort+slice+join), extract a pure function into `widgets/<name>/model.ts` and import it. No shared dashboard "aggregation module" — each widget owns its own slice.

### Non-goals

- No new dashboard endpoints on the backend.
- No widget drag/drop or user-customisable layout.
- No shared dashboard filter bar (date range, etc.) — out of scope for this spec.
- No splitting `DashboardStats` into four separate widgets.

---

## Testing

No new test infrastructure. Each section is verified manually:

- **Section 1:** Open login and register pages at 375px, 768px, 1440px widths in Chrome devtools responsive mode — no horizontal scroll, form legible, inputs reachable.
- **Section 2:** On each of the 8 admin pages, click every sortable column header and verify the rows reorder correctly. Verify the select and actions columns are not sortable.
- **Section 3:** Create/update a vehicle, cycle it through all three statuses via the row actions menu, verify the badge and filter update. Open the create-trip dialog and confirm only `ACTIVE` vehicles appear in the selector.
- **Section 4:** Open the dashboard with populated data and with an empty database. Verify every widget renders with a `Card` wrapper, shows a skeleton during load, shows the empty state when the backing list is empty, and the page is visually identical (or better) to the pre-refactor version.

## File summary

**Created (8 files):**
- `apps/web/src/shared/ui/data-table/column-header.tsx`
- `apps/web/src/shared/ui/widget-skeleton.tsx`
- `apps/web/src/shared/ui/widget-empty.tsx`
- `apps/web/src/widgets/trips-by-status/ui.tsx` + `index.ts`
- `apps/web/src/widgets/top-drivers/ui.tsx` + `index.ts`
- (plus any `model.ts` files needed for heavy aggregation)

**Modified:**
- `apps/api/prisma/schema.prisma` + new migration
- `apps/web/src/shared/config/constants.ts`
- `apps/web/src/shared/ui/data-table/index.tsx`
- `apps/web/src/features/auth/login-form.tsx`, `register-form.tsx`
- `apps/web/src/pages/auth/login.tsx`, `register.tsx`
- `apps/web/src/pages/admin/cargos.tsx`, `contractors.tsx`, `drivers.tsx`, `routes.tsx`, `trips.tsx`, `users.tsx`, `vehicles.tsx`, `waybills.tsx`
- `apps/web/src/features/create-trip/*` (vehicle selector)
- `apps/web/src/pages/admin/dashboard.tsx` (massive simplification)
- Existing widgets `dashboard-stats`, `trips-per-week`, `trips-table`, `waybills-table` — wrap in `Card` + add skeleton/empty handling where missing
