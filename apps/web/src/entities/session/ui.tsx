import { Badge } from '@/shared/ui/badge';
import { ROLE_LABELS } from '@/shared/config/constants';

export function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    ADMIN: 'bg-primary-100 text-primary-800',
    LOGIST: 'bg-accent-100 text-accent-800',
    DRIVER: 'bg-secondary-100 text-secondary-800',
  };

  return (
    <Badge className={colors[role] ?? ''}>
      {ROLE_LABELS[role] ?? role}
    </Badge>
  );
}
