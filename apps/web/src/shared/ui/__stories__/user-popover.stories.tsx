import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CaretDown, SignOut } from '@phosphor-icons/react';
import { Badge } from '../badge';
import { Button } from '../button';

/**
 * Упрощённая версия UserPopover без зависимости от effector-стора.
 * Принимает данные пользователя через пропсы.
 */
function UserPopoverDemo({ fullName, role, roleLabel }: {
  fullName: string;
  role: string;
  roleLabel: string;
}) {
  const [open, setOpen] = useState(false);

  const ROLE_VARIANT: Record<string, 'danger' | 'info' | 'neutral'> = {
    ADMIN: 'danger',
    LOGIST: 'info',
    DRIVER: 'neutral',
  };

  const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
      >
        <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
          {initials}
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-foreground leading-none">{fullName}</p>
          <p className="text-xs text-muted-foreground">{roleLabel}</p>
        </div>
        <CaretDown size={14} className="text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-popover border border-border rounded-xl shadow-lg p-2 animate-in fade-in-0 zoom-in-95">
            <div className="px-3 py-2 border-b border-border mb-2">
              <p className="text-sm font-medium text-foreground">{fullName}</p>
              <Badge variant={ROLE_VARIANT[role] ?? 'neutral'} size="sm" className="mt-1">
                {roleLabel}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-destructive hover:text-destructive"
              onClick={() => setOpen(false)}
            >
              <SignOut size={16} />
              Выйти
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

const meta: Meta<typeof UserPopoverDemo> = {
  title: 'UI/UserPopover',
  component: UserPopoverDemo,
};
export default meta;
type Story = StoryObj<typeof UserPopoverDemo>;

export const Admin: Story = {
  args: {
    fullName: 'Иванов Иван',
    role: 'ADMIN',
    roleLabel: 'Администратор',
  },
  name: 'Администратор',
};

export const Logist: Story = {
  args: {
    fullName: 'Петрова Мария',
    role: 'LOGIST',
    roleLabel: 'Логист',
  },
  name: 'Логист',
};

export const Driver: Story = {
  args: {
    fullName: 'Сидоров Алексей',
    role: 'DRIVER',
    roleLabel: 'Водитель',
  },
  name: 'Водитель',
};
