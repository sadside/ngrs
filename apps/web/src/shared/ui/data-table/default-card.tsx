import { flexRender, type Row, type Cell } from '@tanstack/react-table';
import { Card } from '@/shared/ui/card';
import { cn } from '@/shared/lib/utils';

/**
 * Default mobile card renderer used when a page does not provide its own.
 * Shows the first non-service column as title, the next two as subtitle.
 */
export function DefaultMobileCard<TData>({ row }: { row: Row<TData> }) {
  const cells = row.getVisibleCells() as Cell<TData, unknown>[];
  const dataCells = cells.filter((c) => c.column.id !== 'select' && c.column.id !== 'actions');
  const [titleCell, ...rest] = dataCells;
  const subtitle = rest.slice(0, 2);
  const footer = rest.slice(2);

  const selectCell = cells.find((c) => c.column.id === 'select');
  const actionsCell = cells.find((c) => c.column.id === 'actions');

  return (
    <Card
      className={cn(
        'p-4 gap-3',
        row.getIsSelected() && 'ring-2 ring-primary',
      )}
    >
      <div className="flex items-start gap-3">
        {selectCell && (
          <div className="pt-1">{flexRender(selectCell.column.columnDef.cell, selectCell.getContext())}</div>
        )}
        <div className="flex-1 min-w-0">
          {titleCell && (
            <div className="font-semibold text-foreground text-base truncate">
              {flexRender(titleCell.column.columnDef.cell, titleCell.getContext())}
            </div>
          )}
          {subtitle.length > 0 && (
            <div className="text-sm text-muted-foreground truncate mt-0.5">
              {subtitle.map((cell) => (
                <span key={cell.id} className="[&:not(:first-child)]:before:content-['·_'] [&:not(:first-child)]:before:mx-1">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </span>
              ))}
            </div>
          )}
        </div>
        {actionsCell && (
          <div>{flexRender(actionsCell.column.columnDef.cell, actionsCell.getContext())}</div>
        )}
      </div>
      {footer.length > 0 && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {footer.map((cell) => {
            const header = cell.column.columnDef.header;
            const headerLabel = typeof header === 'string' ? header : cell.column.id;
            return (
              <div key={cell.id} className="flex flex-col">
                <span className="text-muted-foreground uppercase tracking-wider text-[10px]">{headerLabel}</span>
                <span className="text-foreground">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
