import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DotsThreeVertical, Eye, PencilSimple, Trash } from '@phosphor-icons/react';
import { cn } from '@/shared/lib/utils';

interface RowActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  children?: React.ReactNode;
}

export function RowActions({ onView, onEdit, onDelete, children }: RowActionsProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({ x: rect.right, y: rect.bottom + 4 });
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const timer = setTimeout(() => {
      document.addEventListener('click', close);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleClick}
        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
      >
        <DotsThreeVertical size={18} weight="bold" />
      </button>

      {open &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: coords.y,
              left: coords.x,
              transform: 'translateX(-100%)',
              zIndex: 9999,
            }}
            className="min-w-[160px] bg-popover border border-border rounded-xl shadow-2xl p-1"
            onClick={(e) => e.stopPropagation()}
          >
            {children ?? (
              <>
                {onView && (
                  <ActionBtn onClick={() => { onView(); setOpen(false); }} icon={Eye} label="Просмотр" />
                )}
                {onEdit && (
                  <ActionBtn onClick={() => { onEdit(); setOpen(false); }} icon={PencilSimple} label="Редактировать" />
                )}
                {onDelete && (
                  <ActionBtn onClick={() => { onDelete(); setOpen(false); }} icon={Trash} label="Удалить" variant="destructive" />
                )}
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

function ActionBtn({
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
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
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

export { ActionBtn as RowActionItem };
