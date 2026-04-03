import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Check, X } from '@phosphor-icons/react';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { ROLE_LABELS, USER_STATUS_LABELS } from '@/shared/config/constants';
import { useUsers, useCreateUser, useUpdateUser } from '@/entities/user/api';
import { RoleBadge } from '@/entities/session/ui';

const userSchema = z.object({
  login: z.string().min(3, 'Минимум 3 символа'),
  password: z.string().min(6, 'Минимум 6 символов'),
  fullName: z.string().min(2, 'Введите ФИО'),
  phone: z.string().optional(),
  role: z.string().min(1, 'Выберите роль'),
});

type UserFormValues = z.infer<typeof userSchema>;

export function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
  });

  const onSubmit = (data: UserFormValues) => {
    const body = {
      ...data,
      phone: data.phone || null,
    };
    createUser.mutate(body, {
      onSuccess: () => {
        toast.success('Пользователь создан');
        setDialogOpen(false);
        reset();
      },
      onError: () => toast.error('Ошибка при создании'),
    });
  };

  const handleApprove = (id: string) => {
    updateUser.mutate(
      { id, status: 'ACTIVE' },
      { onSuccess: () => toast.success('Пользователь активирован') }
    );
  };

  const handleBlock = (id: string) => {
    updateUser.mutate(
      { id, status: 'BLOCKED' },
      { onSuccess: () => toast.success('Пользователь заблокирован') }
    );
  };

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    BLOCKED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary-500 hover:bg-primary-600 text-white">
              <Plus size={18} className="mr-2" /> Добавить
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый пользователь</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div className="space-y-2">
                <Label>Логин</Label>
                <Input {...register('login')} placeholder="ivanov" />
                {errors.login && <p className="text-sm text-danger">{errors.login.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Пароль</Label>
                <Input type="password" {...register('password')} placeholder="Минимум 6 символов" />
                {errors.password && <p className="text-sm text-danger">{errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>ФИО</Label>
                <Input {...register('fullName')} placeholder="Иванов Иван Иванович" />
                {errors.fullName && <p className="text-sm text-danger">{errors.fullName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Телефон (необязательно)</Label>
                <Input {...register('phone')} placeholder="+7..." />
              </div>
              <div className="space-y-2">
                <Label>Роль</Label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Выберите..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.role && <p className="text-sm text-danger">{errors.role.message}</p>}
              </div>
              <Button type="submit" className="w-full bg-primary-500 hover:bg-primary-600 text-white cursor-pointer" disabled={createUser.isPending}>
                {createUser.isPending ? 'Создание...' : 'Создать'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Логин</TableHead>
              <TableHead>ФИО</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Дата создания</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.login}</TableCell>
                <TableCell>{u.fullName}</TableCell>
                <TableCell>
                  <RoleBadge role={u.role} />
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[u.status] ?? ''}>
                    {USER_STATUS_LABELS[u.status] ?? u.status}
                  </Badge>
                </TableCell>
                <TableCell>{u.phone ?? '—'}</TableCell>
                <TableCell>{new Date(u.createdAt).toLocaleDateString('ru-RU')}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {u.status !== 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleApprove(u.id)}
                        title="Активировать"
                      >
                        <Check size={16} className="text-green-600" />
                      </Button>
                    )}
                    {u.status !== 'BLOCKED' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleBlock(u.id)}
                        title="Заблокировать"
                      >
                        <X size={16} className="text-red-600" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {users?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Нет данных
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
