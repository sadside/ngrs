import type { ComponentType } from 'react';
import { cn } from '@/shared/lib/utils';

interface WidgetEmptyProps {
  icon: ComponentType<{ size?: number; weight?: string; className?: string }>;
  message: string;
  className?: string;
}

export function WidgetEmpty({ icon: Icon, message, className }: WidgetEmptyProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-10', className)}>
      <div className="p-3 rounded-2xl bg-muted">
        <Icon size={32} weight="light" className="text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground text-center">{message}</p>
    </div>
  );
}
