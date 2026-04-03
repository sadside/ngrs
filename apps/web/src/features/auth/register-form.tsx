import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { registerFn } from '@/entities/session/api';

const registerSchema = z.object({
  login: z.string().min(3, 'Минимум 3 символа'),
  password: z.string().min(6, 'Минимум 6 символов'),
  fullName: z.string().min(2, 'Введите ФИО'),
  phone: z.string().optional(),
});

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const mutation = useMutation({
    mutationFn: registerFn,
    onSuccess: () => {
      toast.success('Заявка отправлена');
      navigate({ to: '/pending' });
    },
    onError: () => {
      toast.error('Ошибка регистрации. Возможно, логин уже занят.');
    },
  });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Регистрация</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="fullName">ФИО</Label>
            <Input
              id="fullName"
              {...register('fullName')}
              placeholder="Иванов Иван Иванович"
            />
            {errors.fullName && (
              <p className="text-sm text-danger">{errors.fullName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="login">Логин</Label>
            <Input
              id="login"
              {...register('login')}
              placeholder="Придумайте логин"
            />
            {errors.login && (
              <p className="text-sm text-danger">{errors.login.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              placeholder="Минимум 6 символов"
            />
            {errors.password && (
              <p className="text-sm text-danger">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Телефон (необязательно)</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="+79001234567"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-primary-500 hover:bg-primary-600 text-white"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Отправка...' : 'Зарегистрироваться'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
