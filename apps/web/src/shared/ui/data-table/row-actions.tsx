import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.right,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleScroll() {
      setOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open, updatePosition]);

  const menu = open
    ? createPortal(
        <div
          ref={menuRef}
          className="fixed z-[100] min-w-[160px] bg-popover border border-border rounded-xl shadow-lg p-1"
          style={{ top: pos.top, left: pos.left, transform: 'translateX(-100%)' }}
        >
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
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <Button
        ref={triggerRef}
        variant="ghost"
        size="icon-sm"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        <DotsThreeVertical size={18} />
      </Button>
      {menu}
    </>
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
