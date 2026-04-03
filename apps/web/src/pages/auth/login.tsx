import { Link } from '@tanstack/react-router';
import { LoginForm } from '@/features/auth/login-form';

export function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary-500">Iridium</h1>
          <p className="text-muted text-sm mt-1">
            Система управления перевозками
          </p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-muted">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-primary-500 hover:underline">
            Регистрация
          </Link>
        </p>
      </div>
    </div>
  );
}
