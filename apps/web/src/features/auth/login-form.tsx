import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { loginFn, getMeFn } from '@/entities/session/api';
import { sessionSet } from '@/entities/session/model';
import { setTokens } from '@/shared/lib/auth';
import { cn } from '@/shared/lib/utils';

interface LoginValues {
  login: string;
  password: string;
}

const inputClass =
  'flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-base outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-primary-300';

export function LoginForm() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    defaultValues: { login: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: loginFn,
    onSuccess: async (data) => {
      if (data.status === 'PENDING') {
        navigate({ to: '/pending' });
        return;
      }
      if (data.accessToken && data.refreshToken) {
        setTokens(data.accessToken, data.refreshToken);
        const user = await getMeFn();
        sessionSet(user);
        if (user.role === 'DRIVER') {
          navigate({ to: '/driver' });
        } else {
          navigate({ to: '/' });
        }
      }
    },
    onError: () => {
      toast.error('Неверный логин или пароль');
    },
  });

  return (
    <Card className="w-[520px] border-0 bg-white shadow-xl rounded-2xl">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Вход</CardTitle>
      </CardHeader>
      <CardContent className="p-8 pt-0">
        <form
          noValidate
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="login">Логин</Label>
            <input
              id="login"
              {...register('login', {
                required: 'Введите логин',
                minLength: { value: 3, message: 'Минимум 3 символа' },
              })}
              placeholder="Введите логин"
              className={cn(inputClass, errors.login && 'border-danger')}
            />
            {errors.login && (
              <p className="text-sm text-danger">{errors.login.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <input
              id="password"
              type="password"
              {...register('password', {
                required: 'Введите пароль',
                minLength: { value: 6, message: 'Минимум 6 символов' },
              })}
              placeholder="Введите пароль"
              className={cn(inputClass, errors.password && 'border-danger')}
            />
            {errors.password && (
              <p className="text-sm text-danger">{errors.password.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full h-11 bg-primary-500 hover:bg-primary-600 text-white cursor-pointer"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Вход...' : 'Войти'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
