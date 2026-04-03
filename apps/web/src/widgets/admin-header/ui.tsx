import { SignOut } from '@phosphor-icons/react';
import { useUnit } from 'effector-react';
import { useNavigate } from '@tanstack/react-router';

import { Button } from '@/shared/ui/button';
import { $user, sessionCleared } from '@/entities/session/model';
import { RoleBadge } from '@/entities/session/ui';

export function AdminHeader() {
  const user = useUnit($user);
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionCleared();
    navigate({ to: '/login' });
  };

  return (
    <header className="h-14 border-b border-secondary-100 bg-white px-6 flex items-center justify-end gap-4">
      {user && (
        <>
          <RoleBadge role={user.role} />
          <span className="text-sm font-medium text-secondary-700">
            {user.fullName}
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <SignOut size={18} />
          </Button>
        </>
      )}
    </header>
  );
}
