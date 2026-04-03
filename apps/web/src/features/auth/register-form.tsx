import { useForm, Controller } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { IMaskInput } from 'react-imask';

import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { registerFn } from '@/entities/session/api';
import { cn } from '@/shared/lib/utils';

interface RegisterValues {
  fullName: string;
  login: string;
  password: string;
  phone: string;
}

const inputClass =
  'flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-base outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-primary-300';

export function RegisterForm() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterValues>({
    defaultValues: { fullName: '', login: '', password: '', phone: '' },
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
    <Card className="w-[520px] border-0 bg-white shadow-xl rounded-2xl">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Регистрация</CardTitle>
      </CardHeader>
      <CardContent className="p-8 pt-0">
        <form
          noValidate
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="fullName">ФИО</Label>
            <input
              id="fullName"
              {...register('fullName', {
                required: 'Введите ФИО',
                minLength: { value: 2, message: 'Минимум 2 символа' },
              })}
              placeholder="Иванов Иван Иванович"
              className={cn(inputClass, errors.fullName && 'border-danger')}
            />
            {errors.fullName && (
              <p className="text-sm text-danger">{errors.fullName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="login">Логин</Label>
            <input
              id="login"
              {...register('login', {
                required: 'Введите логин',
                minLength: { value: 3, message: 'Минимум 3 символа' },
              })}
              placeholder="Придумайте логин"
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
              placeholder="Минимум 6 символов"
              className={cn(inputClass, errors.password && 'border-danger')}
            />
            {errors.password && (
              <p className="text-sm text-danger">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Телефон (необязательно)</Label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <IMaskInput
                  mask="+7 (000) 000-00-00"
                  value={field.value || ''}
                  onAccept={(value: string) => field.onChange(value)}
                  placeholder="+7 (___) ___-__-__"
                  id="phone"
                  className={inputClass}
                />
              )}
            />
          </div>
          <Button
            type="submit"
            className="w-full h-11 bg-primary-500 hover:bg-primary-600 text-white cursor-pointer"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Отправка...' : 'Зарегистрироваться'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
