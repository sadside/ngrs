import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  dark?: boolean;
  index?: number;
}

function AnimatedNumber({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    const end = value;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.round(end * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [value, duration, isInView]);

  return <span ref={ref}>{display}</span>;
}

export function StatCard({ label, value, icon: Icon, trend, trendUp, dark }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-4 flex flex-col justify-between',
        dark ? 'bg-primary border-primary/80 text-white' : 'bg-card border-border',
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={cn('text-sm', dark ? 'text-white/70' : 'text-muted-foreground')}>
          {label}
        </span>
        <div className={cn('p-1.5 rounded-lg', dark ? 'bg-white/10' : 'bg-muted')}>
          <Icon
            size={18}
            weight="duotone"
            className={dark ? 'text-white' : 'text-muted-foreground'}
          />
        </div>
      </div>
      <p className={cn('text-2xl font-bold tabular-nums', dark ? 'text-white' : 'text-foreground')}>
        <AnimatedNumber value={value} />
      </p>
      {trend && (
        <div className="flex items-center gap-1 mt-1">
          <span
            className={cn('text-xs font-medium', trendUp ? 'text-accent' : 'text-destructive')}
          >
            {trendUp ? '↑' : '↓'} {trend}
          </span>
          <span className={cn('text-xs', dark ? 'text-white/50' : 'text-muted-foreground')}>
            vs вчера
          </span>
        </div>
      )}
    </div>
  );
}
