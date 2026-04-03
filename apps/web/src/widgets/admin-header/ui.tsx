import { SignOut } from '@phosphor-icons/react';
import { useUnit } from 'effector-react';
import { useNavigate, useLocation } from '@tanstack/react-router';

import { Button } from '@/shared/ui/button';
import { $user, sessionCleared } from '@/entities/session/model';
import { RoleBadge } from '@/entities/session/ui';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Дашборд',
  '/trips': 'Рейсы',
  '/waybills': 'Накладные',
  '/drivers': 'Водители',
  '/vehicles': 'Транспорт',
  '/contractors': 'Контрагенты',
  '/routes': 'Маршруты',
  '/cargos': 'Грузы',
  '/users': 'Пользователи',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const base = '/' + pathname.split('/').filter(Boolean)[0];
  return PAGE_TITLES[base] ?? '';
}

export function AdminHeader() {
  const user = useUnit($user);
  const navigate = useNavigate();
  const location = useLocation();

  const pageTitle = getPageTitle(location.pathname);

  const handleLogout = () => {
    sessionCleared();
    navigate({ to: '/login' });
  };

  return (
    <header className="h-14 border-b border-secondary-100 bg-white px-6 flex items-center justify-between">
      <h1 className="text-lg font-semibold text-secondary-900">{pageTitle}</h1>
      <div className="flex items-center gap-4">
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
      </div>
    </header>
  );
}
