import { Link } from '@tanstack/react-router';
import { RegisterForm } from '@/features/auth/register-form';

export function RegisterPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4 sm:px-6">
      <div className="w-full max-w-[520px] space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">НГРС</h1>
          <p className="text-muted-foreground text-sm mt-1">Регистрация водителя</p>
        </div>
        <RegisterForm />
        <p className="text-center text-sm text-muted-foreground">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
