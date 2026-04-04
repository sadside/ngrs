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
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Checkbox } from '@/shared/ui/checkbox';
import { Button } from '@/shared/ui/button';
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

      <div className="rounded-xl border border-border bg-card flex-1">
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

      {Object.keys(rowSelection).length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-card border border-border rounded-xl px-5 py-3 shadow-2xl animate-in fade-in-0 slide-in-from-bottom-2">
          <span className="text-sm text-foreground font-medium">
            Выбрано: {table.getFilteredSelectedRowModel().rows.length}
          </span>
          <div className="h-5 w-px bg-border" />
          <Button variant="outline" size="sm" onClick={() => toast.info('Экспорт в CSV будет добавлен позже')}>
            Экспорт CSV
          </Button>
          <Button variant="danger" size="sm" onClick={() => toast.info('Множественное удаление будет добавлено позже')}>
            Удалить
          </Button>
          <Button variant="ghost" size="sm" onClick={() => table.toggleAllRowsSelected(false)}>
            Отменить
          </Button>
        </div>
      )}
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
