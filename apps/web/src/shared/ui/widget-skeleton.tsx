import { cn } from '@/shared/lib/utils';

interface WidgetSkeletonProps {
  variant: 'chart' | 'table' | 'stats' | 'list';
  className?: string;
}

const shimmer =
  'relative overflow-hidden bg-muted/50 rounded-md before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-foreground/5 before:to-transparent before:animate-[shimmer_1.8s_infinite]';

export function WidgetSkeleton({ variant, className }: WidgetSkeletonProps) {
  if (variant === 'chart') {
    return (
      <div className={cn('flex h-[240px] w-full items-end gap-2 px-2', className)}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={cn(shimmer, 'flex-1')}
            style={{ height: `${40 + ((i * 13) % 55)}%` }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn('space-y-2', className)}>
        <div className={cn(shimmer, 'h-8 w-full')} />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={cn(shimmer, 'h-10 w-full')} />
        ))}
      </div>
    );
  }

  if (variant === 'stats') {
    return (
      <div className={cn('grid grid-cols-2 lg:grid-cols-5 gap-4', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={cn(shimmer, 'h-24')} />
        ))}
      </div>
    );
  }

  // list
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={cn(shimmer, 'h-10 w-10 rounded-full')} />
          <div className="flex-1 space-y-1.5">
            <div className={cn(shimmer, 'h-3 w-2/3')} />
            <div className={cn(shimmer, 'h-2.5 w-1/3')} />
          </div>
        </div>
      ))}
    </div>
  );
}
