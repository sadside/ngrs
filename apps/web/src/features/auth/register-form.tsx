import { useForm, Controller } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { IMaskInput } from 'react-imask';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { registerFn } from '@/entities/session/api';

interface RegisterValues {
  fullName: string;
  login: string;
  password: string;
  phone: string;
}

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
    <Card className="w-full max-w-[520px] bg-card border border-border rounded-2xl">
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
            <Input
              id="fullName"
              {...register('fullName', {
                required: 'Введите ФИО',
                minLength: { value: 2, message: 'Минимум 2 символа' },
              })}
              placeholder="Иванов Иван Иванович"
              className={errors.fullName ? 'border-destructive' : ''}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="login">Логин</Label>
            <Input
              id="login"
              {...register('login', {
                required: 'Введите логин',
                minLength: { value: 3, message: 'Минимум 3 символа' },
              })}
              placeholder="Придумайте логин"
              className={errors.login ? 'border-destructive' : ''}
            />
            {errors.login && (
              <p className="text-sm text-destructive">{errors.login.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              {...register('password', {
                required: 'Введите пароль',
                minLength: { value: 6, message: 'Минимум 6 символов' },
              })}
              placeholder="Минимум 6 символов"
              className={errors.password ? 'border-destructive' : ''}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
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
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
                />
              )}
            />
          </div>
          <Button
            type="submit"
            className="w-full h-11"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Отправка...' : 'Зарегистрироваться'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
