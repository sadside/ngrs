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
import { MobileFilterSheet } from './mobile-filter-sheet';

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
    <div className="flex flex-col gap-3">
      {/* Row 1: search + create button */}
      <div className="flex items-center gap-3">
        <Input
          variant="search"
          placeholder={searchPlaceholder}
          value={globalFilter}
          onChange={(e) => onGlobalFilterChange(e.target.value)}
          className="flex-1 md:max-w-md"
        />

        {/* Desktop: inline filters */}
        {filterOptions?.map((filter) => (
          <Select
            key={filter.key}
            value={(table.getColumn(filter.key)?.getFilterValue() as string) ?? '__all__'}
            onValueChange={(value) =>
              table.getColumn(filter.key)?.setFilterValue(value === '__all__' ? undefined : value)
            }
          >
            <SelectTrigger className="hidden md:flex w-[180px] h-10">
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

        <div className="hidden md:block flex-1" />

        {selectedCount > 0 && (
          <span className="hidden md:inline text-sm text-muted-foreground">
            Выбрано: {selectedCount}
          </span>
        )}

        {onCreateClick && (
          <Button onClick={onCreateClick}>
            <Plus size={18} />
            <span className="hidden md:inline">{createLabel}</span>
          </Button>
        )}
      </div>

      {/* Row 2: mobile filter sheet trigger */}
      {filterOptions && filterOptions.length > 0 && (
        <div className="md:hidden">
          <MobileFilterSheet table={table} filterOptions={filterOptions} />
        </div>
      )}
    </div>
  );
}
