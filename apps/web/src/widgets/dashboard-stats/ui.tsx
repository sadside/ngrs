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
        dark ? 'bg-secondary-900 border-secondary-800 text-white' : 'bg-white border-border',
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={cn('text-sm', dark ? 'text-secondary-300' : 'text-secondary-500')}>
          {label}
        </span>
        <div className={cn('p-1.5 rounded-lg', dark ? 'bg-secondary-700' : 'bg-secondary-50')}>
          <Icon
            size={18}
            weight="duotone"
            className={dark ? 'text-white' : 'text-secondary-400'}
          />
        </div>
      </div>
      <p className={cn('text-2xl font-bold tabular-nums', dark ? 'text-white' : 'text-secondary-900')}>
        <AnimatedNumber value={value} />
      </p>
      {trend && (
        <div className="flex items-center gap-1 mt-1">
          <span
            className={cn('text-xs font-medium', trendUp ? 'text-green-400' : 'text-red-400')}
          >
            {trendUp ? '↑' : '↓'} {trend}
          </span>
          <span className={cn('text-xs', dark ? 'text-secondary-400' : 'text-secondary-400')}>
            vs вчера
          </span>
        </div>
      )}
    </div>
  );
}
