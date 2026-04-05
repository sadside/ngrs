import { type Table } from '@tanstack/react-table';
import { useState } from 'react';
import { Plus, Funnel } from '@phosphor-icons/react';
import { cn } from '@/shared/lib/utils';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/shared/ui/sheet';

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
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const activeFilterCount = (filterOptions ?? []).filter(
    (f) => table.getColumn(f.key)?.getFilterValue() !== undefined,
  ).length;

  const hasFilters = !!filterOptions && filterOptions.length > 0;

  return (
    <div className="flex items-center gap-3">
      {/* Search with embedded mobile filter trigger */}
      <div className="relative flex-1 md:max-w-md">
        <Input
          variant="search"
          placeholder={searchPlaceholder}
          value={globalFilter}
          onChange={(e) => onGlobalFilterChange(e.target.value)}
          className={cn(hasFilters && 'pr-12 md:pr-3')}
        />
        {hasFilters && (
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="md:hidden absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Фильтры"
          >
            <Funnel size={18} weight="bold" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>

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
        <Button onClick={onCreateClick} className="shrink-0">
          <Plus size={18} />
          <span className="hidden md:inline">{createLabel}</span>
        </Button>
      )}

      {/* Mobile filter sheet */}
      {hasFilters && (
        <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl p-0 max-h-[80vh] flex flex-col">
            <SheetHeader className="border-b border-border p-4">
              <SheetTitle>Фильтры</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {filterOptions!.map((filter) => (
                <div key={filter.key} className="space-y-2">
                  <label className="text-sm font-medium">{filter.label}</label>
                  <Select
                    value={(table.getColumn(filter.key)?.getFilterValue() as string) ?? '__all__'}
                    onValueChange={(value) =>
                      table
                        .getColumn(filter.key)
                        ?.setFilterValue(value === '__all__' ? undefined : value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={filter.label} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Все</SelectItem>
                      {filter.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <SheetFooter className="border-t border-border p-4 flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  filterOptions!.forEach((f) => table.getColumn(f.key)?.setFilterValue(undefined));
                }}
                className="flex-1"
              >
                Сбросить
              </Button>
              <Button onClick={() => setMobileFilterOpen(false)} className="flex-1">
                Применить
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
