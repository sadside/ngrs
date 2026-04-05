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
