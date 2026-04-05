import type { Icon } from '@phosphor-icons/react';
import { cn } from '@/shared/lib/utils';

interface WidgetEmptyProps {
  icon: Icon;
  message: string;
  className?: string;
}

export function WidgetEmpty({ icon: IconComponent, message, className }: WidgetEmptyProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-10', className)}>
      <div className="p-3 rounded-2xl bg-muted">
        <IconComponent size={32} weight="light" className="text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground text-center">{message}</p>
    </div>
  );
}
