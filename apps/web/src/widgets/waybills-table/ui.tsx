import { useMemo } from 'react';
import { FileText } from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { WidgetSkeleton } from '@/shared/ui/widget-skeleton';
import { WidgetEmpty } from '@/shared/ui/widget-empty';
import { useWaybills } from '@/entities/waybill/api';

export function RecentWaybills() {
  const { data: waybills, isLoading } = useWaybills();

  const recent = useMemo(
    () =>
      [...(waybills ?? [])]
        .sort(
          (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
        )
        .slice(0, 5),
    [waybills],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Последние накладные</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <WidgetSkeleton variant="list" />
        ) : recent.length === 0 ? (
          <WidgetEmpty icon={FileText} message="Нет накладных" />
        ) : (
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {recent.map((wb) => (
              <div key={wb.id} className="flex items-center gap-3 py-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText size={18} className="text-primary" weight="duotone" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">ТТН {wb.ttnNumber}</p>
                  <p className="text-xs text-muted-foreground">{wb.driverFullName}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(wb.submittedAt).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
