import { Link } from '@tanstack/react-router';
import { LoginForm } from '@/features/auth/login-form';

export function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-secondary-950 via-accent-950 to-secondary-900">
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white">Iridium</h1>
          <p className="text-secondary-300 text-sm mt-1">
            Система управления перевозками
          </p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-secondary-300">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-primary-400 hover:underline">
            Регистрация
          </Link>
        </p>
      </div>
    </div>
  );
}
