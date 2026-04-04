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
