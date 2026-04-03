import { Link } from '@tanstack/react-router';
import { RegisterForm } from '@/features/auth/register-form';

export function RegisterPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary-500">Iridium</h1>
          <p className="text-muted text-sm mt-1">Регистрация водителя</p>
        </div>
        <RegisterForm />
        <p className="text-center text-sm text-muted">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-primary-500 hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
