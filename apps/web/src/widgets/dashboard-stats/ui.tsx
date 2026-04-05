import { useEffect, useMemo, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { Truck, Path, CheckCircle, FileText, Users } from '@phosphor-icons/react';
import { cn } from '@/shared/lib/utils';
import { useTrips } from '@/entities/trip/api';
import { useWaybills } from '@/entities/waybill/api';
import { WidgetSkeleton } from '@/shared/ui/widget-skeleton';

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

// --- DashboardStats composite widget ---

const ACTIVE_STATUSES = [
  'EN_ROUTE_TO_LOADING',
  'LOADING',
  'EN_ROUTE_TO_UNLOADING',
  'UNLOADING',
];

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

function yesterdayIso() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export function DashboardStats() {
  const { data: trips, isLoading: tripsLoading } = useTrips();
  const { data: waybills, isLoading: waybillsLoading } = useWaybills();

  const today = todayIso();
  const yesterday = yesterdayIso();

  const metrics = useMemo(() => {
    const tripsToday = trips?.filter((t) => t.assignedAt.startsWith(today)) ?? [];
    const tripsYesterday = trips?.filter((t) => t.assignedAt.startsWith(yesterday)) ?? [];
    const activeTrips = trips?.filter((t) => ACTIVE_STATUSES.includes(t.status)) ?? [];
    const completedToday =
      trips?.filter((t) => t.status === 'COMPLETED' && t.completedAt?.startsWith(today)) ?? [];
    const waybillsToday = waybills?.filter((w) => w.submittedAt.startsWith(today)) ?? [];
    const activeDrivers = new Set(activeTrips.map((t) => t.driver.id)).size;

    const trendPercent =
      tripsYesterday.length === 0
        ? tripsToday.length > 0
          ? 100
          : 0
        : Math.round(
            ((tripsToday.length - tripsYesterday.length) / tripsYesterday.length) * 100,
          );

    return {
      tripsToday: tripsToday.length,
      activeTrips: activeTrips.length,
      completedToday: completedToday.length,
      waybillsToday: waybillsToday.length,
      activeDrivers,
      trendPercent,
    };
  }, [trips, waybills, today, yesterday]);

  if (tripsLoading || waybillsLoading) {
    return <WidgetSkeleton variant="stats" />;
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        label="Рейсов сегодня"
        value={metrics.tripsToday}
        trend={`${Math.abs(metrics.trendPercent)}%`}
        trendUp={metrics.trendPercent >= 0}
        icon={Truck}
        dark
        index={0}
      />
      <StatCard label="В пути" value={metrics.activeTrips} icon={Path} index={1} />
      <StatCard label="Завершено" value={metrics.completedToday} icon={CheckCircle} index={2} />
      <StatCard label="Накладных" value={metrics.waybillsToday} icon={FileText} index={3} />
      <StatCard label="Водителей" value={metrics.activeDrivers} icon={Users} index={4} />
    </div>
  );
}
