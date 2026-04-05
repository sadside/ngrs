# Group A — Polish & UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship four polish improvements to Iridium TMS frontend — mobile-adapted auth pages, sortable admin tables, `IN_REPAIR` vehicle status, and a dashboard refactored into standalone widgets wrapped in `Card`.

**Architecture:** Frontend-only for sections 1, 2, 4. Section 3 adds one Prisma enum value (additive migration) and wires it through the existing vehicle CRUD. No new tests — the project has no test infrastructure; verification is manual via `pnpm web:build` + browser checks.

**Tech Stack:** React + Vite, TypeScript, Tailwind, shadcn/ui, `@tanstack/react-table`, `@tanstack/react-query`, Prisma, echarts, recharts, phosphor-icons.

**Spec:** `docs/superpowers/specs/2026-04-05-group-a-polish-ux-design.md`

**Build command:** `pnpm web:build` (runs `tsc -b && vite build` for `@iridium/web`).
**Migration command:** `pnpm db:migrate` (runs prisma migrate dev in `@iridium/api`).
**Dev URL:** `http://localhost:5173` (after `pnpm web:dev`).

**Note on an existing hook:** `useVehicles(status?: string)` in `apps/web/src/entities/vehicle/api.ts` already supports server-side status filtering, and `features/create-trip/ui.tsx` already calls `useVehicles('ACTIVE')`. Section 3 therefore requires no changes to the create-trip dialog — the new `IN_REPAIR` status is transparently excluded from the vehicle selector because the backend filter is `status === 'ACTIVE'`.

---

## Section 1 — Auth Pages Mobile Adaptation

### Task 1: Make auth forms and pages fluid on mobile

**Files:**
- Modify: `apps/web/src/features/auth/login-form.tsx`
- Modify: `apps/web/src/features/auth/register-form.tsx`
- Modify: `apps/web/src/pages/auth/login.tsx`
- Modify: `apps/web/src/pages/auth/register.tsx`

- [ ] **Step 1: Replace fixed width on `LoginForm`**

In `apps/web/src/features/auth/login-form.tsx`, change the `Card` className:

```tsx
// before
<Card className="w-[520px] bg-card border border-border rounded-2xl">
// after
<Card className="w-full max-w-[520px] bg-card border border-border rounded-2xl">
```

- [ ] **Step 2: Replace fixed width on `RegisterForm`**

In `apps/web/src/features/auth/register-form.tsx`:

```tsx
// before
<Card className="w-[520px] bg-card border border-border rounded-2xl">
// after
<Card className="w-full max-w-[520px] bg-card border border-border rounded-2xl">
```

- [ ] **Step 3: Add responsive padding to login page wrapper**

In `apps/web/src/pages/auth/login.tsx`, update the outer container and heading:

```tsx
import { Link } from '@tanstack/react-router';
import { LoginForm } from '@/features/auth/login-form';

export function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4 sm:px-6">
      <div className="w-full max-w-[520px] space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Iridium</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Система управления перевозками
          </p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-primary hover:underline">
            Регистрация
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add responsive padding to register page wrapper**

In `apps/web/src/pages/auth/register.tsx`:

```tsx
import { Link } from '@tanstack/react-router';
import { RegisterForm } from '@/features/auth/register-form';

export function RegisterPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4 sm:px-6">
      <div className="w-full max-w-[520px] space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Iridium</h1>
          <p className="text-muted-foreground text-sm mt-1">Регистрация водителя</p>
        </div>
        <RegisterForm />
        <p className="text-center text-sm text-muted-foreground">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Typecheck**

Run: `pnpm web:build`
Expected: PASS (no TS errors).

- [ ] **Step 6: Manual verification**

Run `pnpm web:dev`. Open Chrome DevTools, responsive mode.
- 375px: `/login` and `/register` — карточка занимает всю ширину минус `px-4`, поля формы читаемы, нет горизонтального скролла.
- 768px: отступы больше (`px-6`), карточка упирается в `max-w-[520px]`.
- 1440px: карточка 520px по центру, выглядит как было раньше.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/features/auth/login-form.tsx apps/web/src/features/auth/register-form.tsx apps/web/src/pages/auth/login.tsx apps/web/src/pages/auth/register.tsx
git commit -m "feat(auth): make login/register forms responsive on mobile"
```

---

## Section 2 — Table Sorting

### Task 2: Wire `getSortedRowModel` into `DataTable`

**Files:**
- Modify: `apps/web/src/shared/ui/data-table/index.tsx`

- [ ] **Step 1: Add sorting state and row model**

In `apps/web/src/shared/ui/data-table/index.tsx`, update the tanstack imports:

```tsx
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
```

Inside `DataTable`, add the sorting state alongside the existing ones:

```tsx
const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
const [globalFilter, setGlobalFilter] = useState('');
const [sorting, setSorting] = useState<SortingState>([]);
```

Then extend the `useReactTable` config:

```tsx
const table = useReactTable({
  data,
  columns,
  state: { columnFilters, rowSelection, globalFilter, sorting },
  onColumnFiltersChange: setColumnFilters,
  onRowSelectionChange: setRowSelection,
  onGlobalFilterChange: setGlobalFilter,
  onSortingChange: setSorting,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  enableRowSelection: true,
});
```

- [ ] **Step 2: Typecheck**

Run: `pnpm web:build`
Expected: PASS. Tables render identically (no sortable headers yet — column defs not updated).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/shared/ui/data-table/index.tsx
git commit -m "feat(data-table): wire tanstack getSortedRowModel"
```

### Task 3: Create `DataTableColumnHeader` component

**Files:**
- Create: `apps/web/src/shared/ui/data-table/column-header.tsx`

- [ ] **Step 1: Write the component**

Create `apps/web/src/shared/ui/data-table/column-header.tsx`:

```tsx
import type { Column } from '@tanstack/react-table';
import { ArrowUp, ArrowDown, ArrowsDownUp } from '@phosphor-icons/react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <span className={cn('text-sm font-medium', className)}>{title}</span>;
  }

  const sorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        '-ml-3 h-8 px-2 data-[state=open]:bg-accent font-medium',
        className,
      )}
      onClick={() => column.toggleSorting(sorted === 'asc')}
    >
      <span>{title}</span>
      {sorted === 'asc' ? (
        <ArrowUp size={14} className="ml-1" weight="bold" />
      ) : sorted === 'desc' ? (
        <ArrowDown size={14} className="ml-1" weight="bold" />
      ) : (
        <ArrowsDownUp size={14} className="ml-1 text-muted-foreground" weight="bold" />
      )}
    </Button>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm web:build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/shared/ui/data-table/column-header.tsx
git commit -m "feat(data-table): add DataTableColumnHeader with sort toggle"
```

### Task 4: Apply sortable headers — users, drivers, vehicles

**Files:**
- Modify: `apps/web/src/pages/admin/users.tsx`
- Modify: `apps/web/src/pages/admin/drivers.tsx`
- Modify: `apps/web/src/pages/admin/vehicles.tsx`

- [ ] **Step 1: Users page**

In `apps/web/src/pages/admin/users.tsx`, add the import near the top:

```tsx
import { DataTableColumnHeader } from '@/shared/ui/data-table/column-header';
```

Replace the column defs so text/date columns use `DataTableColumnHeader`, and add `enableSorting: false` to the actions column:

```tsx
{
  accessorKey: 'login',
  header: ({ column }) => <DataTableColumnHeader column={column} title="Логин" />,
},
{
  accessorKey: 'fullName',
  header: ({ column }) => <DataTableColumnHeader column={column} title="ФИО" />,
},
{
  accessorKey: 'role',
  header: ({ column }) => <DataTableColumnHeader column={column} title="Роль" />,
  cell: ({ row }) => <RoleBadge role={row.original.role} />,
  filterFn: 'equals',
},
{
  accessorKey: 'status',
  header: ({ column }) => <DataTableColumnHeader column={column} title="Статус" />,
  cell: ({ row }) => (
    <Badge variant={statusVariant[row.original.status] ?? 'neutral'}>
      {USER_STATUS_LABELS[row.original.status] ?? row.original.status}
    </Badge>
  ),
  filterFn: 'equals',
},
{
  accessorKey: 'phone',
  header: ({ column }) => <DataTableColumnHeader column={column} title="Телефон" />,
  cell: ({ row }) => row.original.phone ?? '—',
},
{
  accessorKey: 'createdAt',
  header: ({ column }) => <DataTableColumnHeader column={column} title="Дата создания" />,
  cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('ru-RU'),
},
{
  id: 'actions',
  header: '',
  enableSorting: false,
  cell: ({ row }) => { /* unchanged */ },
  size: 50,
},
```

Keep `getSelectColumn<User>()` first in the array — it already has `enableSorting: false`.

- [ ] **Step 2: Drivers page**

In `apps/web/src/pages/admin/drivers.tsx`, add the import and apply the same pattern to every non-select, non-actions column. For each column with `accessorKey` or `id` that maps to a sortable value (fullName, login, status, phone, createdAt, etc.), wrap its header in `DataTableColumnHeader`. Add `enableSorting: false` to the actions column.

Pattern for reference (apply to every text/date/number column in the file):

```tsx
{
  accessorKey: 'fullName',
  header: ({ column }) => <DataTableColumnHeader column={column} title="ФИО" />,
},
```

- [ ] **Step 3: Vehicles page**

In `apps/web/src/pages/admin/vehicles.tsx`, update column defs. The `brand` column has a custom cell but can still sort by `brand`:

```tsx
{
  accessorKey: 'brand',
  header: ({ column }) => <DataTableColumnHeader column={column} title="Марка/Модель" />,
  cell: ({ row }) => `${row.original.brand} ${row.original.model}`,
},
{
  accessorKey: 'licensePlate',
  header: ({ column }) => <DataTableColumnHeader column={column} title="Госномер" />,
},
{
  accessorKey: 'trailerPlate',
  header: ({ column }) => <DataTableColumnHeader column={column} title="Прицеп" />,
  cell: ({ row }) => row.original.trailerPlate ?? '—',
},
{
  id: 'driver',
  header: ({ column }) => <DataTableColumnHeader column={column} title="Водитель" />,
  accessorFn: (row) => row.assignedDriver?.fullName ?? '',
  cell: ({ row }) => row.original.assignedDriver?.fullName ?? '—',
},
{
  accessorKey: 'ownershipType',
  header: ({ column }) => <DataTableColumnHeader column={column} title="Тип владения" />,
  cell: ({ row }) => OWNERSHIP_LABELS[row.original.ownershipType] ?? row.original.ownershipType,
},
{
  accessorKey: 'status',
  header: ({ column }) => <DataTableColumnHeader column={column} title="Статус" />,
  cell: ({ row }) => (
    <Badge variant={statusVariant[row.original.status] ?? 'neutral'}>
      {VEHICLE_STATUS_LABELS[row.original.status] ?? row.original.status}
    </Badge>
  ),
  filterFn: 'equals',
},
{
  id: 'actions',
  enableSorting: false,
  cell: ({ row }) => ( /* unchanged */ ),
  size: 50,
},
```

Note the `driver` column gets an `accessorFn` so tanstack can sort by it — previously it only had a `cell` function with no sortable value.

- [ ] **Step 4: Typecheck**

Run: `pnpm web:build`
Expected: PASS.

- [ ] **Step 5: Manual verification**

Run `pnpm web:dev`, open `/admin/users`, `/admin/drivers`, `/admin/vehicles`. On each page:
- Click each column header — стрелка появляется, строки пересортировались asc. Второй клик — desc. Третий клик — сортировка сбрасывается.
- Чекбокс-колонка и колонка actions — без стрелки и не кликабельны.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/admin/users.tsx apps/web/src/pages/admin/drivers.tsx apps/web/src/pages/admin/vehicles.tsx
git commit -m "feat(tables): sortable headers on users, drivers, vehicles"
```

### Task 5: Apply sortable headers — cargos, contractors, routes

**Files:**
- Modify: `apps/web/src/pages/admin/cargos.tsx`
- Modify: `apps/web/src/pages/admin/contractors.tsx`
- Modify: `apps/web/src/pages/admin/routes.tsx`

- [ ] **Step 1: Add the import to each file**

Add to the top of all three files:

```tsx
import { DataTableColumnHeader } from '@/shared/ui/data-table/column-header';
```

- [ ] **Step 2: Wrap every sortable column header**

For each text/date/number column in all three files, replace the static `header: 'Название'` string with:

```tsx
header: ({ column }) => <DataTableColumnHeader column={column} title="Название" />,
```

Apply to every column that has `accessorKey` or `accessorFn`. For columns with `id` + `accessorFn`, the same pattern works. For the actions column (if present), add `enableSorting: false`.

For each file: walk the `columns` array top to bottom, wrap every non-select non-actions header, save. There is no shared helper — repeat the wrap verbatim in each column def.

- [ ] **Step 3: Typecheck**

Run: `pnpm web:build`
Expected: PASS.

- [ ] **Step 4: Manual verification**

Open `/admin/cargos`, `/admin/contractors`, `/admin/routes`. Sort each column once asc, once desc.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/admin/cargos.tsx apps/web/src/pages/admin/contractors.tsx apps/web/src/pages/admin/routes.tsx
git commit -m "feat(tables): sortable headers on cargos, contractors, routes"
```

### Task 6: Apply sortable headers — trips, waybills

**Files:**
- Modify: `apps/web/src/pages/admin/trips.tsx`
- Modify: `apps/web/src/pages/admin/waybills.tsx`

- [ ] **Step 1: Trips page**

In `apps/web/src/pages/admin/trips.tsx`, add the import:

```tsx
import { DataTableColumnHeader } from '@/shared/ui/data-table/column-header';
```

Update the columns. `driver`, `vehicle`, `cargo`, `route` columns already use `accessorFn` so they are sortable by the returned string automatically:

```tsx
const columns: ColumnDef<Trip>[] = [
  getSelectColumn<Trip>(),
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Статус" />,
    cell: ({ row }) => <TripStatusBadge status={row.original.status} />,
    filterFn: (row, id, value) => value === undefined || row.getValue(id) === value,
  },
  {
    id: 'driver',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Водитель" />,
    accessorFn: (row) => row.driver.fullName,
  },
  {
    id: 'route',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Маршрут" />,
    accessorFn: (row) => `${row.route.senderContractor.name} → ${row.route.receiverContractor.name}`,
    cell: ({ row }) => (
      <span className="truncate max-w-[250px] block">
        {row.original.route.senderContractor.name} → {row.original.route.receiverContractor.name}
      </span>
    ),
  },
  {
    id: 'vehicle',
    header: ({ column }) => <DataTableColumnHeader column={column} title="ТС" />,
    accessorFn: (row) => row.vehicle.licensePlate,
  },
  {
    id: 'cargo',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Груз" />,
    accessorFn: (row) => row.cargo.name,
  },
  {
    id: 'ttn',
    header: ({ column }) => <DataTableColumnHeader column={column} title="ТТН" />,
    accessorFn: (row) => row.waybill?.ttnNumber ?? '',
    cell: ({ row }) => row.original.waybill?.ttnNumber ?? '—',
  },
  {
    accessorKey: 'assignedAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Дата" />,
    cell: ({ row }) => new Date(row.original.assignedAt).toLocaleDateString('ru-RU'),
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: () => (
      <RowActions onDelete={() => toast.info('Удаление рейсов будет добавлено позже')} />
    ),
    size: 50,
  },
];
```

The `route` column gains an `accessorFn` so tanstack has a string to sort by, while `cell` still renders the styled span. The `ttn` column also gains `accessorFn`.

- [ ] **Step 2: Waybills page**

In `apps/web/src/pages/admin/waybills.tsx`, add the `DataTableColumnHeader` import and wrap every non-select non-actions header (e.g. `ttnNumber`, `weight`, `loadWeight`, `driverFullName`, `submittedAt`) using the same pattern. Add `enableSorting: false` to the actions column.

Example:

```tsx
{
  accessorKey: 'ttnNumber',
  header: ({ column }) => <DataTableColumnHeader column={column} title="ТТН" />,
},
{
  accessorKey: 'submittedAt',
  header: ({ column }) => <DataTableColumnHeader column={column} title="Дата отправки" />,
  cell: ({ row }) => new Date(row.original.submittedAt).toLocaleString('ru-RU'),
},
```

- [ ] **Step 3: Typecheck**

Run: `pnpm web:build`
Expected: PASS.

- [ ] **Step 4: Manual verification**

Open `/admin/trips` and `/admin/waybills`. Click each sortable header — строки переставляются. Для рейсов особое внимание: сортировка по «Водитель» и «Маршрут» должна работать (там accessorFn).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/admin/trips.tsx apps/web/src/pages/admin/waybills.tsx
git commit -m "feat(tables): sortable headers on trips and waybills"
```

---

## Section 3 — Vehicle `IN_REPAIR` Status

### Task 7: Add `IN_REPAIR` to Prisma enum and frontend constants

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Modify: `apps/web/src/shared/config/constants.ts`

- [ ] **Step 1: Update Prisma enum**

In `apps/api/prisma/schema.prisma`, replace the `VehicleStatus` enum:

```prisma
enum VehicleStatus {
  ACTIVE
  IN_REPAIR
  INACTIVE
}
```

- [ ] **Step 2: Run the migration**

Run: `pnpm db:migrate`
When prompted for a migration name, enter: `vehicle_status_in_repair`
Expected: migration created, applied to local DB, Prisma client regenerated.

- [ ] **Step 3: Update frontend constants**

In `apps/web/src/shared/config/constants.ts`:

```ts
export const VEHICLE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Активен',
  IN_REPAIR: 'На ремонте',
  INACTIVE: 'Неактивен',
};
```

- [ ] **Step 4: Typecheck**

Run: `pnpm web:build`
Expected: PASS. Existing vehicles still render as ACTIVE/INACTIVE — no data migration required.

- [ ] **Step 5: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations apps/web/src/shared/config/constants.ts
git commit -m "feat(vehicles): add IN_REPAIR status to enum"
```

### Task 8: Vehicles page — status badge, filter, row actions for status change

**Files:**
- Modify: `apps/web/src/pages/admin/vehicles.tsx`

- [ ] **Step 1: Update badge variant mapping**

In `apps/web/src/pages/admin/vehicles.tsx`, extend the `statusVariant` map to cover the new status:

```tsx
const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  ACTIVE: 'success',
  IN_REPAIR: 'warning',
  INACTIVE: 'neutral',
};
```

- [ ] **Step 2: Import extra dependencies**

Add to the top of the file (alongside existing imports):

```tsx
import { RowActionItem } from '@/shared/ui/data-table/row-actions';
import { CheckCircle, Wrench, Prohibit } from '@phosphor-icons/react';
import { useUpdateVehicle } from '@/entities/vehicle/api';
```

(`useUpdateVehicle` already exists in `entities/vehicle/api.ts` — no new hook needed.)

- [ ] **Step 3: Replace the static `columns` const with a `useMemo` inside the component**

Columns now depend on `updateVehicle.mutate`, which lives inside the component. Move the column definitions into `VehiclesPage` using `useMemo`, and create the status-change handlers. Replace the top-of-file `const columns: ColumnDef<Vehicle, any>[] = [ ... ]` block with a dummy no-op (or delete it), then inside `VehiclesPage()` — above the `useForm` call — insert:

```tsx
const updateVehicle = useUpdateVehicle();

const handleSetStatus = (id: string, status: 'ACTIVE' | 'IN_REPAIR' | 'INACTIVE') => {
  updateVehicle.mutate(
    { id, status },
    {
      onSuccess: () => {
        const labels: Record<typeof status, string> = {
          ACTIVE: 'Машина активирована',
          IN_REPAIR: 'Машина отправлена на ремонт',
          INACTIVE: 'Машина деактивирована',
        };
        toast.success(labels[status]);
      },
      onError: () => toast.error('Не удалось обновить статус'),
    },
  );
};

const columns = useMemo<ColumnDef<Vehicle, any>[]>(() => [
  getSelectColumn<Vehicle>(),
  {
    accessorKey: 'brand',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Марка/Модель" />,
    cell: ({ row }) => `${row.original.brand} ${row.original.model}`,
  },
  {
    accessorKey: 'licensePlate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Госномер" />,
  },
  {
    accessorKey: 'trailerPlate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Прицеп" />,
    cell: ({ row }) => row.original.trailerPlate ?? '—',
  },
  {
    id: 'driver',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Водитель" />,
    accessorFn: (row) => row.assignedDriver?.fullName ?? '',
    cell: ({ row }) => row.original.assignedDriver?.fullName ?? '—',
  },
  {
    accessorKey: 'ownershipType',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Тип владения" />,
    cell: ({ row }) => OWNERSHIP_LABELS[row.original.ownershipType] ?? row.original.ownershipType,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Статус" />,
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status] ?? 'neutral'}>
        {VEHICLE_STATUS_LABELS[row.original.status] ?? row.original.status}
      </Badge>
    ),
    filterFn: 'equals',
  },
  {
    id: 'actions',
    enableSorting: false,
    cell: ({ row }) => {
      const v = row.original;
      return (
        <RowActions>
          {v.status !== 'ACTIVE' && (
            <RowActionItem
              onClick={() => handleSetStatus(v.id, 'ACTIVE')}
              icon={CheckCircle}
              label="Активировать"
            />
          )}
          {v.status !== 'IN_REPAIR' && (
            <RowActionItem
              onClick={() => handleSetStatus(v.id, 'IN_REPAIR')}
              icon={Wrench}
              label="Отправить на ремонт"
            />
          )}
          {v.status !== 'INACTIVE' && (
            <RowActionItem
              onClick={() => handleSetStatus(v.id, 'INACTIVE')}
              icon={Prohibit}
              label="Деактивировать"
              variant="destructive"
            />
          )}
        </RowActions>
      );
    },
    size: 50,
  },
], []);
```

The filter options are already built from `VEHICLE_STATUS_LABELS` (`filterOptions` at module scope), so the new `IN_REPAIR` option appears automatically in the toolbar filter. No change to `filterOptions` needed.

- [ ] **Step 4: Typecheck**

Run: `pnpm web:build`
Expected: PASS.

- [ ] **Step 5: Manual verification**

Run `pnpm web:dev`, open `/admin/vehicles`.
- Бейджи трёх цветов отображаются корректно (зелёный ACTIVE, жёлтый IN_REPAIR — если есть такие машины, серый INACTIVE).
- Кликни RowActions на активной машине → видны пункты «Отправить на ремонт» и «Деактивировать», НЕТ пункта «Активировать».
- Нажми «Отправить на ремонт» → toast, статус в таблице меняется на жёлтый бейдж, dropdown на этой же строке теперь показывает «Активировать» и «Деактивировать».
- Верни машину в ACTIVE, открой фильтр «Статус» в toolbar → там три опции (Активен, На ремонте, Неактивен). Выбери «На ремонте» — таблица фильтрует.
- Открой `/admin/trips`, нажми «Создать рейс». В селекте ТС машин со статусом IN_REPAIR быть НЕ должно (useVehicles('ACTIVE') фильтрует на бэке).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/admin/vehicles.tsx
git commit -m "feat(vehicles): IN_REPAIR badge + status change row actions"
```

---

## Section 4 — Dashboard Widgets Refactor

### Task 9: Create `WidgetSkeleton` shared component

**Files:**
- Create: `apps/web/src/shared/ui/widget-skeleton.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { cn } from '@/shared/lib/utils';

interface WidgetSkeletonProps {
  variant: 'chart' | 'table' | 'stats' | 'list';
  className?: string;
}

const shimmer =
  'relative overflow-hidden bg-muted/50 rounded-md before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-foreground/5 before:to-transparent before:animate-[shimmer_1.8s_infinite]';

export function WidgetSkeleton({ variant, className }: WidgetSkeletonProps) {
  if (variant === 'chart') {
    return (
      <div className={cn('flex h-[240px] w-full items-end gap-2 px-2', className)}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={cn(shimmer, 'flex-1')}
            style={{ height: `${40 + ((i * 13) % 55)}%` }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn('space-y-2', className)}>
        <div className={cn(shimmer, 'h-8 w-full')} />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={cn(shimmer, 'h-10 w-full')} />
        ))}
      </div>
    );
  }

  if (variant === 'stats') {
    return (
      <div className={cn('grid grid-cols-2 lg:grid-cols-5 gap-4', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={cn(shimmer, 'h-24')} />
        ))}
      </div>
    );
  }

  // list
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={cn(shimmer, 'h-10 w-10 rounded-full')} />
          <div className="flex-1 space-y-1.5">
            <div className={cn(shimmer, 'h-3 w-2/3')} />
            <div className={cn(shimmer, 'h-2.5 w-1/3')} />
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Register the shimmer keyframe in Tailwind**

Check `apps/web/src/index.css`. If the `shimmer` keyframe is not already defined there, append:

```css
@theme {
  /* existing theme vars ... */
}

@keyframes shimmer {
  100% { transform: translateX(100%); }
}
```

Put the `@keyframes` block at the bottom of the file outside the `@theme` block. If a `shimmer` keyframe already exists (from other animations), skip this step.

- [ ] **Step 3: Typecheck**

Run: `pnpm web:build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/shared/ui/widget-skeleton.tsx apps/web/src/index.css
git commit -m "feat(ui): add WidgetSkeleton with chart/table/stats/list variants"
```

### Task 10: Create `WidgetEmpty` shared component

**Files:**
- Create: `apps/web/src/shared/ui/widget-empty.tsx`

- [ ] **Step 1: Write the component**

```tsx
import type { ComponentType } from 'react';
import { cn } from '@/shared/lib/utils';

interface WidgetEmptyProps {
  icon: ComponentType<{ size?: number; weight?: string; className?: string }>;
  message: string;
  className?: string;
}

export function WidgetEmpty({ icon: Icon, message, className }: WidgetEmptyProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-10', className)}>
      <div className="p-3 rounded-2xl bg-muted">
        <Icon size={32} weight="light" className="text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground text-center">{message}</p>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm web:build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/shared/ui/widget-empty.tsx
git commit -m "feat(ui): add WidgetEmpty placeholder component"
```

### Task 11: Refactor `TripsPerWeek` to self-fetch

**Files:**
- Modify: `apps/web/src/widgets/trips-per-week/ui.tsx`
- Create: `apps/web/src/widgets/trips-per-week/index.ts`

Currently `TripsPerWeek` takes a `chartData` prop and the dashboard page computes the array. Move the computation inside the widget.

- [ ] **Step 1: Rewrite `widgets/trips-per-week/ui.tsx`**

```tsx
"use client";

import React, { useMemo } from 'react';
import { Bar, BarChart, XAxis, Cell } from 'recharts';
import { ChartLineUp } from '@phosphor-icons/react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '../../../@/shared/ui/chart';
import { useTrips } from '@/entities/trip/api';
import { WidgetSkeleton } from '@/shared/ui/widget-skeleton';
import { WidgetEmpty } from '@/shared/ui/widget-empty';

const chartConfig = {
  trips: {
    label: 'Рейсы',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export function TripsPerWeek() {
  const { data: trips, isLoading } = useTrips();
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const chartData = useMemo(() => {
    const last7 = getLast7Days();
    return last7.map((day) => ({
      day: new Date(day).toLocaleDateString('ru-RU', { weekday: 'short' }),
      trips: trips?.filter((t) => t.assignedAt.startsWith(day)).length ?? 0,
    }));
  }, [trips]);

  const hasData = chartData.some((d) => d.trips > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Рейсы за неделю</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <WidgetSkeleton variant="chart" />
        ) : !hasData ? (
          <WidgetEmpty icon={ChartLineUp} message="Нет рейсов за последние 7 дней" />
        ) : (
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={chartData}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <rect x="0" y="0" width="100%" height="85%" fill="url(#highlighted-pattern-dots)" />
              <defs>
                <DottedBackgroundPattern />
              </defs>
              <XAxis
                dataKey="day"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="trips" radius={6} fill="var(--color-primary)">
                {chartData.map((_, index) => (
                  <Cell
                    className="duration-200"
                    key={`cell-${index}`}
                    fillOpacity={activeIndex === null ? 1 : activeIndex === index ? 1 : 0.3}
                    stroke={activeIndex === index ? 'var(--color-primary)' : ''}
                    onMouseEnter={() => setActiveIndex(index)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

const DottedBackgroundPattern = () => (
  <pattern id="highlighted-pattern-dots" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
    <circle className="dark:text-muted/40 text-muted" cx="2" cy="2" r="1" fill="currentColor" />
  </pattern>
);
```

- [ ] **Step 2: Add the index re-export**

Create `apps/web/src/widgets/trips-per-week/index.ts`:

```ts
export { TripsPerWeek } from './ui';
```

- [ ] **Step 3: Typecheck**

Run: `pnpm web:build`
Expected: it will FAIL because `dashboard.tsx` still passes `chartData` to `TripsPerWeek`. This is expected — Task 17 fixes the dashboard page. For this task, temporarily tolerate the build break by commenting out the dashboard import/usage OR proceed straight to the next widget tasks and fix the dashboard last.

Recommended: proceed; do not commit a broken build. Wait until Task 17 and squash commits if needed. Simpler approach: in this task only, also temporarily patch dashboard to call `<TripsPerWeek />` without props — it still works because the widget now self-fetches. Apply this minimal edit:

In `apps/web/src/pages/admin/dashboard.tsx`, change:

```tsx
<TripsPerWeek chartData={tripsPerWeekChartData} />
```

to:

```tsx
<TripsPerWeek />
```

The old `tripsPerWeekChartData` useMemo and its dependencies remain in dashboard.tsx for now; Task 17 deletes them.

- [ ] **Step 4: Typecheck after the dashboard fix**

Run: `pnpm web:build`
Expected: PASS.

- [ ] **Step 5: Manual verification**

Run `pnpm web:dev`, open `/`. The "Рейсы за неделю" виджет рендерится как раньше; во время начальной загрузки на секунду виден скелетон.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/widgets/trips-per-week/ui.tsx apps/web/src/widgets/trips-per-week/index.ts apps/web/src/pages/admin/dashboard.tsx
git commit -m "refactor(widgets): make TripsPerWeek self-fetch via useTrips"
```

### Task 12: Create `DashboardStats` widget (self-fetching)

**Files:**
- Create: `apps/web/src/widgets/dashboard-stats/index.ts`
- Modify: `apps/web/src/widgets/dashboard-stats/ui.tsx`

The file `widgets/dashboard-stats/ui.tsx` currently exports only `StatCard`. Add a `DashboardStats` component that composes 5 `StatCard`s and fetches its own data.

- [ ] **Step 1: Append `DashboardStats` to `widgets/dashboard-stats/ui.tsx`**

At the bottom of the existing file (keep `StatCard` and `AnimatedNumber` unchanged), append:

```tsx
import { useMemo as useMemoDS } from 'react';
import { Truck, Path, CheckCircle, FileText, Users } from '@phosphor-icons/react';
import { useTrips } from '@/entities/trip/api';
import { useWaybills } from '@/entities/waybill/api';
import { WidgetSkeleton } from '@/shared/ui/widget-skeleton';

const ACTIVE_STATUSES = [
  'EN_ROUTE_TO_LOADING',
  'LOADING',
  'EN_ROUTE_TO_UNLOADING',
  'UNLOADING',
];

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

function yesterdayIso() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export function DashboardStats() {
  const { data: trips, isLoading: tripsLoading } = useTrips();
  const { data: waybills, isLoading: waybillsLoading } = useWaybills();

  const today = todayIso();
  const yesterday = yesterdayIso();

  const metrics = useMemoDS(() => {
    const tripsToday = trips?.filter((t) => t.assignedAt.startsWith(today)) ?? [];
    const tripsYesterday = trips?.filter((t) => t.assignedAt.startsWith(yesterday)) ?? [];
    const activeTrips = trips?.filter((t) => ACTIVE_STATUSES.includes(t.status)) ?? [];
    const completedToday =
      trips?.filter((t) => t.status === 'COMPLETED' && t.completedAt?.startsWith(today)) ?? [];
    const waybillsToday = waybills?.filter((w) => w.submittedAt.startsWith(today)) ?? [];
    const activeDrivers = new Set(activeTrips.map((t) => t.driver.id)).size;

    const trendPercent =
      tripsYesterday.length === 0
        ? tripsToday.length > 0
          ? 100
          : 0
        : Math.round(
            ((tripsToday.length - tripsYesterday.length) / tripsYesterday.length) * 100,
          );

    return {
      tripsToday: tripsToday.length,
      activeTrips: activeTrips.length,
      completedToday: completedToday.length,
      waybillsToday: waybillsToday.length,
      activeDrivers,
      trendPercent,
    };
  }, [trips, waybills, today, yesterday]);

  if (tripsLoading || waybillsLoading) {
    return <WidgetSkeleton variant="stats" />;
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        label="Рейсов сегодня"
        value={metrics.tripsToday}
        trend={`${Math.abs(metrics.trendPercent)}%`}
        trendUp={metrics.trendPercent >= 0}
        icon={Truck}
        dark
        index={0}
      />
      <StatCard label="В пути" value={metrics.activeTrips} icon={Path} index={1} />
      <StatCard label="Завершено" value={metrics.completedToday} icon={CheckCircle} index={2} />
      <StatCard label="Накладных" value={metrics.waybillsToday} icon={FileText} index={3} />
      <StatCard label="Водителей" value={metrics.activeDrivers} icon={Users} index={4} />
    </div>
  );
}
```

Rename the extra `useMemo` import alias (`useMemoDS`) only if the file does not already import `useMemo`. If it does, import normally. Check the file's existing imports — currently it only imports `useEffect`, `useRef`, `useState`, so add `useMemo` to the first import statement at the top, and drop the alias:

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
```

Then replace `useMemoDS` with `useMemo` in the appended code.

- [ ] **Step 2: Create the index re-export**

Create `apps/web/src/widgets/dashboard-stats/index.ts`:

```ts
export { DashboardStats, StatCard } from './ui';
```

- [ ] **Step 3: Typecheck**

Run: `pnpm web:build`
Expected: PASS (dashboard still imports `StatCard` from `@/widgets/dashboard-stats/ui` — unchanged, still works).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/widgets/dashboard-stats/ui.tsx apps/web/src/widgets/dashboard-stats/index.ts
git commit -m "feat(widgets): add self-fetching DashboardStats aggregate widget"
```

### Task 13: Create `TripsByStatus` donut widget

**Files:**
- Create: `apps/web/src/widgets/trips-by-status/ui.tsx`
- Create: `apps/web/src/widgets/trips-by-status/index.ts`

- [ ] **Step 1: Write the widget**

Create `apps/web/src/widgets/trips-by-status/ui.tsx`:

```tsx
import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { ChartPie } from '@phosphor-icons/react';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { WidgetSkeleton } from '@/shared/ui/widget-skeleton';
import { WidgetEmpty } from '@/shared/ui/widget-empty';
import { useTrips } from '@/entities/trip/api';

echarts.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

export function TripsByStatus() {
  const { data: trips, isLoading } = useTrips();

  const option = useMemo(() => {
    const counts = [
      { name: 'Назначен', value: trips?.filter((t) => t.status === 'ASSIGNED').length ?? 0, color: '#606E80' },
      {
        name: 'В пути',
        value:
          trips?.filter((t) =>
            ['EN_ROUTE_TO_LOADING', 'EN_ROUTE_TO_UNLOADING'].includes(t.status),
          ).length ?? 0,
        color: '#3765F6',
      },
      {
        name: 'Погрузка/Выгрузка',
        value: trips?.filter((t) => ['LOADING', 'UNLOADING'].includes(t.status)).length ?? 0,
        color: '#F59E0B',
      },
      { name: 'Завершён', value: trips?.filter((t) => t.status === 'COMPLETED').length ?? 0, color: '#70FC8E' },
      { name: 'Отменён', value: trips?.filter((t) => t.status === 'CANCELLED').length ?? 0, color: '#EF4444' },
    ].filter((s) => s.value > 0);

    return {
      tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
      series: [
        {
          type: 'pie' as const,
          radius: ['55%', '80%'],
          center: ['50%', '50%'],
          itemStyle: { borderRadius: 6, borderColor: 'transparent', borderWidth: 2 },
          label: { show: false },
          data: counts.map((s) => ({ name: s.name, value: s.value, itemStyle: { color: s.color } })),
        },
      ],
    };
  }, [trips]);

  const hasData = (trips ?? []).length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Статусы рейсов</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <WidgetSkeleton variant="chart" />
        ) : !hasData ? (
          <WidgetEmpty icon={ChartPie} message="Нет рейсов для отображения" />
        ) : (
          <ReactEChartsCore echarts={echarts} option={option} style={{ height: 240 }} />
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create the index**

Create `apps/web/src/widgets/trips-by-status/index.ts`:

```ts
export { TripsByStatus } from './ui';
```

- [ ] **Step 3: Typecheck**

Run: `pnpm web:build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/widgets/trips-by-status
git commit -m "feat(widgets): add TripsByStatus donut widget"
```

### Task 14: Create `TopDrivers` widget

**Files:**
- Create: `apps/web/src/widgets/top-drivers/ui.tsx`
- Create: `apps/web/src/widgets/top-drivers/index.ts`

- [ ] **Step 1: Write the widget**

Create `apps/web/src/widgets/top-drivers/ui.tsx`:

```tsx
import { useMemo } from 'react';
import { Users } from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { WidgetSkeleton } from '@/shared/ui/widget-skeleton';
import { WidgetEmpty } from '@/shared/ui/widget-empty';
import { useTrips } from '@/entities/trip/api';

interface DriverStat {
  id: string;
  fullName: string;
  tripCount: number;
}

export function TopDrivers() {
  const { data: trips, isLoading } = useTrips();

  const top = useMemo<DriverStat[]>(() => {
    if (!trips) return [];
    const counts = new Map<string, DriverStat>();
    for (const trip of trips) {
      const existing = counts.get(trip.driver.id);
      if (existing) {
        existing.tripCount += 1;
      } else {
        counts.set(trip.driver.id, {
          id: trip.driver.id,
          fullName: trip.driver.fullName,
          tripCount: 1,
        });
      }
    }
    return Array.from(counts.values())
      .sort((a, b) => b.tripCount - a.tripCount)
      .slice(0, 5);
  }, [trips]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Топ водителей</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <WidgetSkeleton variant="list" />
        ) : top.length === 0 ? (
          <WidgetEmpty icon={Users} message="Нет данных по водителям" />
        ) : (
          <ol className="space-y-3">
            {top.map((driver, i) => (
              <li key={driver.id} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-foreground truncate">{driver.fullName}</span>
                <span className="text-sm font-medium text-muted-foreground tabular-nums">
                  {driver.tripCount}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create the index**

Create `apps/web/src/widgets/top-drivers/index.ts`:

```ts
export { TopDrivers } from './ui';
```

- [ ] **Step 3: Typecheck**

Run: `pnpm web:build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/widgets/top-drivers
git commit -m "feat(widgets): add TopDrivers ranking widget"
```

### Task 15: Create `RecentTrips` widget

**Files:**
- Modify: `apps/web/src/widgets/trips-table/ui.tsx` (currently empty stub `export {};`)
- Create: `apps/web/src/widgets/trips-table/index.ts`

We reuse the existing `widgets/trips-table` folder (currently an empty stub) and implement a `RecentTrips` component there.

- [ ] **Step 1: Replace the stub with a real component**

Overwrite `apps/web/src/widgets/trips-table/ui.tsx`:

```tsx
import { useMemo } from 'react';
import { Truck } from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { WidgetSkeleton } from '@/shared/ui/widget-skeleton';
import { WidgetEmpty } from '@/shared/ui/widget-empty';
import { TripStatusBadge } from '@/entities/trip/ui';
import { useTrips } from '@/entities/trip/api';

export function RecentTrips() {
  const { data: trips, isLoading } = useTrips();

  const recent = useMemo(
    () =>
      [...(trips ?? [])]
        .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())
        .slice(0, 10),
    [trips],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Последние рейсы</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <WidgetSkeleton variant="table" />
        ) : recent.length === 0 ? (
          <WidgetEmpty icon={Truck} message="Нет рейсов" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3 font-medium">Код</th>
                  <th className="py-2 pr-3 font-medium">Водитель</th>
                  <th className="py-2 pr-3 font-medium">Маршрут</th>
                  <th className="py-2 pr-3 font-medium">Статус</th>
                  <th className="py-2 font-medium">Дата</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recent.map((trip) => (
                  <tr key={trip.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 pr-3 font-medium text-foreground whitespace-nowrap">
                      {trip.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="py-2.5 pr-3 text-foreground whitespace-nowrap">
                      {trip.driver.fullName}
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground truncate max-w-[200px]">
                      {trip.route.senderContractor.name} → {trip.route.receiverContractor.name}
                    </td>
                    <td className="py-2.5 pr-3">
                      <TripStatusBadge status={trip.status} />
                    </td>
                    <td className="py-2.5 text-muted-foreground whitespace-nowrap">
                      {new Date(trip.assignedAt).toLocaleDateString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create the index**

Create `apps/web/src/widgets/trips-table/index.ts`:

```ts
export { RecentTrips } from './ui';
```

- [ ] **Step 3: Typecheck**

Run: `pnpm web:build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/widgets/trips-table
git commit -m "feat(widgets): implement RecentTrips widget"
```

### Task 16: Create `RecentWaybills` widget

**Files:**
- Modify: `apps/web/src/widgets/waybills-table/ui.tsx` (currently empty stub)
- Create: `apps/web/src/widgets/waybills-table/index.ts`

- [ ] **Step 1: Replace the stub**

Overwrite `apps/web/src/widgets/waybills-table/ui.tsx`:

```tsx
import { useMemo } from 'react';
import { FileText } from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { WidgetSkeleton } from '@/shared/ui/widget-skeleton';
import { WidgetEmpty } from '@/shared/ui/widget-empty';
import { useWaybills } from '@/entities/waybill/api';

export function RecentWaybills() {
  const { data: waybills, isLoading } = useWaybills();

  const recent = useMemo(
    () =>
      [...(waybills ?? [])]
        .sort(
          (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
        )
        .slice(0, 5),
    [waybills],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Последние накладные</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <WidgetSkeleton variant="list" />
        ) : recent.length === 0 ? (
          <WidgetEmpty icon={FileText} message="Нет накладных" />
        ) : (
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {recent.map((wb) => (
              <div key={wb.id} className="flex items-center gap-3 py-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText size={18} className="text-primary" weight="duotone" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">ТТН {wb.ttnNumber}</p>
                  <p className="text-xs text-muted-foreground">{wb.driverFullName}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(wb.submittedAt).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create the index**

Create `apps/web/src/widgets/waybills-table/index.ts`:

```ts
export { RecentWaybills } from './ui';
```

- [ ] **Step 3: Typecheck**

Run: `pnpm web:build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/widgets/waybills-table
git commit -m "feat(widgets): implement RecentWaybills widget"
```

### Task 17: Simplify `DashboardPage` to pure layout

**Files:**
- Modify: `apps/web/src/pages/admin/dashboard.tsx`

- [ ] **Step 1: Replace the entire file contents**

Overwrite `apps/web/src/pages/admin/dashboard.tsx`:

```tsx
import { useUnit } from 'effector-react';
import { $user } from '@/entities/session/model';
import { PageHeader } from '@/widgets/page-header/ui';
import { DashboardStats } from '@/widgets/dashboard-stats';
import { TripsPerWeek } from '@/widgets/trips-per-week';
import { TripsByStatus } from '@/widgets/trips-by-status';
import { TopDrivers } from '@/widgets/top-drivers';
import { RecentTrips } from '@/widgets/trips-table';
import { RecentWaybills } from '@/widgets/waybills-table';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
}

export function DashboardPage() {
  const user = useUnit($user);
  const greeting = getGreeting();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${user?.fullName ?? ''}`}
        description="Вот сводка за сегодня"
      />
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

All inline `useMemo` calls, echarts imports, `StatCard` usage, and inline JSX tables are deleted — they now live in the widgets. The `alertTrips` section from the old dashboard is dropped (out of scope for Group A; can be revived as a separate `TripAlerts` widget later if needed).

- [ ] **Step 2: Typecheck**

Run: `pnpm web:build`
Expected: PASS. The file should be ~40 lines.

- [ ] **Step 3: Manual verification**

Run `pnpm web:dev`, open `/`.
- Dashboard рендерится: приветствие, 5 KPI (`DashboardStats`), две строки чартов, `RecentTrips`, `RecentWaybills`.
- При первой загрузке видны скелетоны в каждом виджете.
- Очисти локальную БД (или примени сид без рейсов) и перезагрузи — каждый виджет показывает `WidgetEmpty` с иконкой и текстом, `CardHeader` с заголовком остаётся виден.
- Каждый виджет обёрнут в `Card` (визуально — единая скруглённая карточка, без двойных границ).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/admin/dashboard.tsx
git commit -m "refactor(dashboard): extract all blocks into self-contained widgets"
```

---

## Final Verification

- [ ] **Run full build**

Run: `pnpm web:build`
Expected: PASS.

- [ ] **Walk through all 4 sections in the browser**

1. `/login` и `/register` на 375/768/1440 — всё адаптивно.
2. Каждая из 8 админ-таблиц — сортировка работает, actions/select не сортируются.
3. `/admin/vehicles` — три статуса, смена статуса из row actions, фильтр в toolbar. `/admin/trips` создание рейса — машины `IN_REPAIR` не в списке.
4. `/` (dashboard) — чистый layout, виджеты в `Card`, скелетоны при загрузке, empty-стейты работают.

- [ ] **Check the dashboard page line count**

Run: `wc -l apps/web/src/pages/admin/dashboard.tsx`
Expected: ~40 lines (down from 531).
