import { type Table } from '@tanstack/react-table';
import { Funnel } from '@phosphor-icons/react';
import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/shared/ui/sheet';
import { Button } from '@/shared/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';

interface MobileFilterSheetProps<TData> {
  table: Table<TData>;
  filterOptions: { key: string; label: string; options: { value: string; label: string }[] }[];
}

export function MobileFilterSheet<TData>({ table, filterOptions }: MobileFilterSheetProps<TData>) {
  const [open, setOpen] = useState(false);

  const activeCount = filterOptions.filter(
    (f) => table.getColumn(f.key)?.getFilterValue() !== undefined,
  ).length;

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="relative">
        <Funnel size={16} weight="bold" />
        Фильтры
        {activeCount > 0 && (
          <span className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
            {activeCount}
          </span>
        )}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl p-0 max-h-[80vh] flex flex-col">
          <SheetHeader className="border-b border-border p-4">
            <SheetTitle>Фильтры</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filterOptions.map((filter) => (
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
                filterOptions.forEach((f) => table.getColumn(f.key)?.setFilterValue(undefined));
              }}
              className="flex-1"
            >
              Сбросить
            </Button>
            <Button onClick={() => setOpen(false)} className="flex-1">
              Применить
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
