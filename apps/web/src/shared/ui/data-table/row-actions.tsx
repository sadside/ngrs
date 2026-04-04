import { Eye, PencilSimple, Trash, DotsThreeVertical } from '@phosphor-icons/react';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { cn } from '@/shared/lib/utils';

interface RowActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  children?: React.ReactNode;
}

export function RowActions({ onView, onEdit, onDelete, children }: RowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <DotsThreeVertical size={18} weight="bold" />
          <span className="sr-only">Действия</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {children ?? (
          <>
            {onView && (
              <DropdownMenuItem onClick={onView}>
                <Eye size={16} className="mr-2" />
                Просмотр
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <PencilSimple size={16} className="mr-2" />
                Редактировать
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={onDelete}>
                  <Trash size={16} className="mr-2" />
                  Удалить
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
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
    <DropdownMenuItem
      onClick={onClick}
      variant={variant}
    >
      <Icon size={16} className="mr-2" />
      {label}
    </DropdownMenuItem>
  );
}
