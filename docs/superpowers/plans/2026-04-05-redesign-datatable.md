# Redesign V2 — DataTable + CRUD Pages (Plan 3/3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all admin CRUD tables with a reusable DataTable system built on @tanstack/react-table — checkboxes, pagination, search, row actions via DropdownMenu, bulk actions toolbar.

**Architecture:** Composable DataTable components in `shared/ui/data-table/`. Each CRUD page defines its columns and passes data. @tanstack/react-table handles sorting, filtering, pagination, row selection. All pages follow the same pattern.

**Tech Stack:** @tanstack/react-table, shadcn Table/Checkbox/DropdownMenu/Pagination, React Query hooks.

---

## File Structure

```
apps/web/src/
├── shared/ui/
│   └── data-table/
│       ├── index.tsx              # DataTable main component
│       ├── toolbar.tsx            # Search + filters + create button
│       ├── pagination.tsx         # Footer with selection info + pagination
│       └── row-actions.tsx        # Kebab menu (View, Edit, Delete)
├── pages/admin/
│   ├── trips.tsx                  # REWRITE with DataTable
│   ├── waybills.tsx               # REWRITE
│   ├── vehicles.tsx               # REWRITE
│   ├── contractors.tsx            # REWRITE
│   ├── cargos.tsx                 # REWRITE
│   ├── routes.tsx                 # REWRITE
│   ├── drivers.tsx                # REWRITE
│   └── users.tsx                  # REWRITE
├── widgets/
│   ├── trips-table/ui.tsx         # DELETE (replaced by DataTable in page)
│   └── waybills-table/ui.tsx      # DELETE (replaced by DataTable in page)
```

---

### Task 1: Install @tanstack/react-table + Create DataTable Components

**Files:**
- Create: `apps/web/src/shared/ui/data-table/index.tsx`
- Create: `apps/web/src/shared/ui/data-table/toolbar.tsx`
- Create: `apps/web/src/shared/ui/data-table/pagination.tsx`
- Create: `apps/web/src/shared/ui/data-table/row-actions.tsx`

- [ ] **Step 1: Install dependency**

```bash
pnpm --filter @iridium/web add @tanstack/react-table
```

- [ ] **Step 2: Create DataTable main component**

```tsx
// apps/web/src/shared/ui/data-table/index.tsx
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Checkbox } from '@/shared/ui/checkbox';
import { DataTableToolbar } from './toolbar';
import { DataTablePagination } from './pagination';

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  filterOptions?: { key: string; label: string; options: { value: string; label: string }[] }[];
  onCreateClick?: () => void;
  createLabel?: string;
  isLoading?: boolean;
}

export function DataTable<TData>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Поиск...',
  filterOptions,
  onCreateClick,
  createLabel = 'Добавить',
  isLoading,
}: DataTableProps<TData>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: { columnFilters, rowSelection, globalFilter },
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
  });

  return (
    <div className="flex flex-col flex-1 gap-4">
      <DataTableToolbar
        table={table}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        searchPlaceholder={searchPlaceholder}
        filterOptions={filterOptions}
        onCreateClick={onCreateClick}
        createLabel={createLabel}
      />

      <div className="rounded-xl border border-border bg-card flex-1 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                    Загрузка...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                    Нет данных
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}

// Re-export helper for checkbox column
export function getSelectColumn<TData>(): ColumnDef<TData, any> {
  return {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Выбрать все"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Выбрать строку"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  };
}
```

- [ ] **Step 3: Create DataTableToolbar**

```tsx
// apps/web/src/shared/ui/data-table/toolbar.tsx
import { type Table } from '@tanstack/react-table';
import { Plus } from '@phosphor-icons/react';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  searchPlaceholder?: string;
  filterOptions?: { key: string; label: string; options: { value: string; label: string }[] }[];
  onCreateClick?: () => void;
  createLabel?: string;
}

export function DataTableToolbar<TData>({
  table,
  globalFilter,
  onGlobalFilterChange,
  searchPlaceholder,
  filterOptions,
  onCreateClick,
  createLabel,
}: DataTableToolbarProps<TData>) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="flex items-center gap-3">
      <Input
        variant="search"
        placeholder={searchPlaceholder}
        value={globalFilter}
        onChange={(e) => onGlobalFilterChange(e.target.value)}
        className="max-w-sm"
      />

      {filterOptions?.map((filter) => (
        <Select
          key={filter.key}
          value={(table.getColumn(filter.key)?.getFilterValue() as string) ?? '__all__'}
          onValueChange={(value) =>
            table.getColumn(filter.key)?.setFilterValue(value === '__all__' ? undefined : value)
          }
        >
          <SelectTrigger className="w-[180px]" size="sm">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Все</SelectItem>
            {filter.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      <div className="flex-1" />

      {selectedCount > 0 && (
        <span className="text-sm text-muted-foreground">
          Выбрано: {selectedCount}
        </span>
      )}

      {onCreateClick && (
        <Button onClick={onCreateClick}>
          <Plus size={18} />
          {createLabel}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create DataTablePagination**

```tsx
// apps/web/src/shared/ui/data-table/pagination.tsx
import { type Table } from '@tanstack/react-table';
import { Button } from '@/shared/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Pagination } from '@/shared/ui/pagination';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
  const totalRows = table.getFilteredRowModel().rows.length;
  const selectedRows = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        {selectedRows > 0
          ? `Выбрано ${selectedRows} из ${totalRows}`
          : `Всего: ${totalRows}`}
      </p>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Строк:</span>
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="w-[70px]" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Pagination
          page={table.getState().pagination.pageIndex + 1}
          totalPages={table.getPageCount()}
          onPageChange={(page) => table.setPageIndex(page - 1)}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create RowActions**

```tsx
// apps/web/src/shared/ui/data-table/row-actions.tsx
import { DotsThreeVertical, Eye, PencilSimple, Trash } from '@phosphor-icons/react';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

interface RowActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function RowActions({ onView, onEdit, onDelete }: RowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <DotsThreeVertical size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onView && (
          <DropdownMenuItem onClick={onView}>
            <Eye size={16} className="mr-2" />
            Просмотр
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <PencilSimple size={16} className="mr-2" />
            Редактировать
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            <Trash size={16} className="mr-2" />
            Удалить
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 6: Build and commit**

```bash
pnpm --filter @iridium/web run build
git add apps/web/src/shared/ui/data-table/ apps/web/package.json pnpm-lock.yaml
git commit -m "feat: add DataTable system with toolbar, pagination, row actions, checkboxes"
```

---

### Task 2: Rewrite Trips Page with DataTable

**Files:**
- Rewrite: `apps/web/src/pages/admin/trips.tsx`
- Delete content: `apps/web/src/widgets/trips-table/ui.tsx` → `export {}`

- [ ] **Step 1: Rewrite trips page**

Define columns using @tanstack/react-table ColumnDef. Include:
- Select checkbox column (from getSelectColumn)
- Status (TripStatusBadge)
- Driver (fullName)
- Route (sender → receiver)
- Vehicle (licensePlate)
- Cargo (name)
- TTN (waybill?.ttnNumber or "—")
- Date (assignedAt formatted)
- Actions (RowActions with onDelete → confirm dialog)

Use `useTrips()` hook. Pass filter options for status. Include CreateTripDialog triggered by onCreateClick.

Keep the create trip dialog from `apps/web/src/features/create-trip/ui.tsx` — import and use it.

```tsx
// apps/web/src/pages/admin/trips.tsx
import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/widgets/page-header/ui';
import { DataTable, getSelectColumn } from '@/shared/ui/data-table';
import { RowActions } from '@/shared/ui/data-table/row-actions';
import { TripStatusBadge } from '@/entities/trip/ui';
import { useTrips, type Trip } from '@/entities/trip/api';
import { TRIP_STATUS_LABELS } from '@/shared/config/constants';
import { CreateTripDialog } from '@/features/create-trip/ui';
// ... etc
```

- [ ] **Step 2: Empty trips-table widget**

```tsx
// apps/web/src/widgets/trips-table/ui.tsx
export {};
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/admin/trips.tsx apps/web/src/widgets/trips-table/
git commit -m "feat: rewrite trips page with DataTable, checkboxes, pagination, row actions"
```

---

### Task 3: Rewrite Waybills Page with DataTable

**Files:**
- Rewrite: `apps/web/src/pages/admin/waybills.tsx`
- Delete content: `apps/web/src/widgets/waybills-table/ui.tsx` → `export {}`

- [ ] **Step 1: Rewrite waybills page**

Columns: Select, TTN (bold), Driver, Weight, Load Weight, Route, Vehicle, Date, Actions.

Use `useWaybills()` hook. Search by TTN via globalFilter.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/pages/admin/waybills.tsx apps/web/src/widgets/waybills-table/
git commit -m "feat: rewrite waybills page with DataTable"
```

---

### Task 4: Rewrite All Remaining CRUD Pages

**Files:**
- Rewrite: `apps/web/src/pages/admin/vehicles.tsx`
- Rewrite: `apps/web/src/pages/admin/contractors.tsx`
- Rewrite: `apps/web/src/pages/admin/cargos.tsx`
- Rewrite: `apps/web/src/pages/admin/routes.tsx`
- Rewrite: `apps/web/src/pages/admin/drivers.tsx`
- Rewrite: `apps/web/src/pages/admin/users.tsx`

- [ ] **Step 1: Rewrite each page using DataTable**

Each page follows the same pattern:
1. Define columns with ColumnDef
2. Include getSelectColumn() as first column
3. Include RowActions as last column
4. Use the entity's React Query hook for data
5. Pass filterOptions for relevant filters
6. Keep existing create/edit dialogs — wire to onCreateClick
7. Keep delete confirmation dialogs — wire to RowActions onDelete

**Vehicles columns:** Select, Brand+Model, License Plate, Trailer, Driver, Ownership, Status badge, Actions
**Contractors columns:** Select, Name, INN, Type badge, Phone, Contact Person, Actions
**Cargos columns:** Select, Name, Technical Spec, UN Code, Hazard Class, Packaging, Actions
**Routes columns:** Select, Sender, Receiver, Loading Address, Unloading Address, Actions
**Drivers columns:** Select, Full Name, Phone, Vehicle, Status badge (read-only, no create)
**Users columns:** Select, Login, Full Name, Role badge, Status badge, Phone, Created Date, Actions (approve/block)

All pages keep their existing create dialogs (Dialog + form). Wire the dialog open state to the DataTable's onCreateClick callback.

- [ ] **Step 2: Build and commit**

```bash
pnpm --filter @iridium/web run build
git add apps/web/src/pages/admin/
git commit -m "feat: rewrite all CRUD pages with DataTable, checkboxes, pagination, row actions"
```

---

### Task 5: Final Build + Cleanup

- [ ] **Step 1: Remove unused imports and files**

Check for unused imports across all modified files. Remove the old trips-table and waybills-table widget directories if empty.

- [ ] **Step 2: Build verification**

```bash
pnpm --filter @iridium/shared run build && pnpm --filter @iridium/web run build
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "chore: cleanup unused widgets and imports after DataTable migration"
```
