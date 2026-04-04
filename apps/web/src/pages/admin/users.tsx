import { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

import { PageHeader } from '@/widgets/page-header/ui';
import { DataTable, getSelectColumn } from '@/shared/ui/data-table';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { RowActions, RowActionItem } from '@/shared/ui/data-table/row-actions';
import { CheckCircle, Prohibit, UserMinus } from '@phosphor-icons/react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { ROLE_LABELS, USER_STATUS_LABELS } from '@/shared/config/constants';
import { useUsers, useCreateUser, useUpdateUser, type User } from '@/entities/user/api';
import { RoleBadge } from '@/entities/session/ui';

const statusVariant: Record<string, 'success' | 'warning' | 'danger'> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  BLOCKED: 'danger',
};

const filterOptions = [
  {
    key: 'role',
    label: 'Роль',
    options: Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    key: 'status',
    label: 'Статус',
    options: Object.entries(USER_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  },
];

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

  const handleApprove = (id: string) => {
    updateUser.mutate(
      { id, status: 'ACTIVE' },
      { onSuccess: () => toast.success('Пользователь активирован') },
    );
  };

  const handleBlock = (id: string) => {
    updateUser.mutate(
      { id, status: 'BLOCKED' },
      { onSuccess: () => toast.success('Пользователь заблокирован') },
    );
  };

  const columns = useMemo<ColumnDef<User, any>[]>(() => [
    getSelectColumn<User>(),
    {
      accessorKey: 'login',
      header: 'Логин',
    },
    {
      accessorKey: 'fullName',
      header: 'ФИО',
    },
    {
      accessorKey: 'role',
      header: 'Роль',
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
      filterFn: 'equals',
    },
    {
      accessorKey: 'status',
      header: 'Статус',
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.status] ?? 'neutral'}>
          {USER_STATUS_LABELS[row.original.status] ?? row.original.status}
        </Badge>
      ),
      filterFn: 'equals',
    },
    {
      accessorKey: 'phone',
      header: 'Телефон',
      cell: ({ row }) => row.original.phone ?? '—',
    },
    {
      accessorKey: 'createdAt',
      header: 'Дата создания',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('ru-RU'),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <RowActions>
            {user.status === 'PENDING' && (
              <RowActionItem onClick={() => handleApprove(user.id)} icon={CheckCircle} label="Активировать" />
            )}
            {user.status === 'ACTIVE' && (
              <RowActionItem onClick={() => handleBlock(user.id)} icon={Prohibit} label="Заблокировать" />
            )}
            <RowActionItem
              onClick={() => toast.info('Увольнение будет добавлено позже')}
              icon={UserMinus}
              label="Уволить"
              variant="destructive"
            />
          </RowActions>
        );
      },
      size: 50,
    },
  ], []);

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

  return (
    <div className="flex flex-col flex-1">
      <PageHeader title="Пользователи" />

      <DataTable
        columns={columns}
        data={users ?? []}
        isLoading={isLoading}
        searchPlaceholder="Поиск пользователей..."
        filterOptions={filterOptions}
        onCreateClick={() => setDialogOpen(true)}
        createLabel="Добавить"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый пользователь</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label>Логин</Label>
              <Input {...register('login')} placeholder="ivanov" />
              {errors.login && <p className="text-sm text-destructive">{errors.login.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Пароль</Label>
              <Input type="password" {...register('password')} placeholder="Минимум 6 символов" />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>ФИО</Label>
              <Input {...register('fullName')} placeholder="Иванов Иван Иванович" />
              {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
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
              {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={createUser.isPending}>
              {createUser.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
