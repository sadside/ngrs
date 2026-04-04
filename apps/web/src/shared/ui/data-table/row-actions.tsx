import { useState, useRef, useEffect } from 'react';
import { DotsThreeVertical, Eye, PencilSimple, Trash } from '@phosphor-icons/react';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

interface RowActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  children?: React.ReactNode;
}

export function RowActions({ onView, onEdit, onDelete, children }: RowActionsProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        <DotsThreeVertical size={18} />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] bg-popover border border-border rounded-xl shadow-lg p-1 animate-in fade-in-0 zoom-in-95">
          {children ? (
            children
          ) : (
            <>
              {onView && (
                <button
                  onClick={() => { onView(); setOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-popover-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <Eye size={16} />
                  Просмотр
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => { onEdit(); setOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-popover-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <PencilSimple size={16} />
                  Редактировать
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => { onDelete(); setOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  <Trash size={16} />
                  Удалить
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function RowActionItem({
  onClick,
  icon: Icon,
  label,
  variant = 'default',
}: {
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  variant?: 'default' | 'destructive';
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer',
        variant === 'destructive'
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-popover-foreground hover:bg-muted',
      )}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}
