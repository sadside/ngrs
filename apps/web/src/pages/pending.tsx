import { ClockCountdown } from '@phosphor-icons/react';
import { Button } from '@/shared/ui/button';
import { clearTokens } from '@/shared/lib/auth';
import { useNavigate } from '@tanstack/react-router';

export function PendingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 text-center">
      <ClockCountdown size={64} className="text-primary mb-6" weight="light" />
      <h1 className="text-2xl font-bold mb-2">Аккаунт на рассмотрении</h1>
      <p className="text-muted max-w-sm mb-8">
        Ваша заявка отправлена. Руководитель подтвердит доступ в ближайшее время.
      </p>
      <Button
        variant="outline"
        onClick={() => {
          clearTokens();
          navigate({ to: '/login' });
        }}
      >
        Выйти
      </Button>
    </div>
  );
}
