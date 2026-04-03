import { Truck, Path, CheckCircle, FileText } from '@phosphor-icons/react';
import { Card } from '@/shared/ui/card';

interface DashboardStatsProps {
  tripsToday: number;
  activeTrips: number;
  completedToday: number;
  waybillsToday: number;
}

const stats = [
  { key: 'tripsToday', label: 'Рейсов сегодня', icon: Truck, bg: 'bg-primary-50', color: 'text-primary-500' },
  { key: 'activeTrips', label: 'В пути', icon: Path, bg: 'bg-accent-50', color: 'text-accent-500' },
  { key: 'completedToday', label: 'Завершено сегодня', icon: CheckCircle, bg: 'bg-green-50', color: 'text-green-600' },
  { key: 'waybillsToday', label: 'Накладных сегодня', icon: FileText, bg: 'bg-secondary-50', color: 'text-secondary-600' },
] as const;

export function DashboardStats({ tripsToday, activeTrips, completedToday, waybillsToday }: DashboardStatsProps) {
  const values: Record<string, number> = { tripsToday, activeTrips, completedToday, waybillsToday };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ key, label, icon: Icon, bg, color }) => (
        <Card key={key} className="bg-white rounded-xl shadow-sm border border-secondary-100 p-5">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${bg}`}>
              <Icon size={24} className={color} weight="duotone" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{values[key]}</p>
              <p className="text-sm text-secondary-400">{label}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
