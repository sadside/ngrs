import { Badge } from '@/shared/ui/badge';
import { ROLE_LABELS } from '@/shared/config/constants';

const ROLE_VARIANT: Record<string, 'danger' | 'info' | 'neutral'> = {
  ADMIN: 'danger',
  LOGIST: 'info',
  DRIVER: 'neutral',
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <Badge variant={ROLE_VARIANT[role] ?? 'neutral'}>
      {ROLE_LABELS[role] ?? role}
    </Badge>
  );
}
