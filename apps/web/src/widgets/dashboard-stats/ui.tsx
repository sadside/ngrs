import { cn } from '@/shared/lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  dark?: boolean;
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
      <p className={cn('text-2xl font-bold', dark ? 'text-white' : 'text-secondary-900')}>
        {value}
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
