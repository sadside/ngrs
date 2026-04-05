import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

import { PageHeader } from '@/widgets/page-header/ui';
import { DataTable, getSelectColumn } from '@/shared/ui/data-table';
import { DataTableColumnHeader } from '@/shared/ui/data-table/column-header';
import { RowActions } from '@/shared/ui/data-table/row-actions';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

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
import { useRoutes, useCreateRoute, type Route } from '@/entities/route/api';
import { useContractors } from '@/entities/contractor/api';

function truncate(str: string, max = 40) {
  return str.length > max ? `${str.slice(0, max)}...` : str;
}

const columns: ColumnDef<Route, any>[] = [
  getSelectColumn<Route>(),
  {
    id: 'sender',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Отправитель" />,
    accessorFn: (row) => row.senderContractor.name,
    cell: ({ row }) => row.original.senderContractor.name,
  },
  {
    id: 'receiver',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Получатель" />,
    accessorFn: (row) => row.receiverContractor.name,
    cell: ({ row }) => row.original.receiverContractor.name,
  },
  {
    accessorKey: 'loadingAddress',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Адрес погрузки" />,
    cell: ({ row }) => truncate(row.original.loadingAddress),
  },
  {
    accessorKey: 'unloadingAddress',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Адрес выгрузки" />,
    cell: ({ row }) => truncate(row.original.unloadingAddress),
  },
  {
    accessorKey: 'description',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Описание" />,
    cell: ({ row }) => row.original.description ?? '—',
  },
  {
    id: 'actions',
    enableSorting: false,
    cell: () => (
      <RowActions
        onDelete={() => toast.info('Функция удаления будет добавлена позже')}
      />
    ),
    size: 50,
  },
];

const routeSchema = z.object({
  senderContractorId: z.string().min(1, 'Выберите отправителя'),
  receiverContractorId: z.string().min(1, 'Выберите получателя'),
  loadingAddress: z.string().min(1, 'Обязательное поле'),
  unloadingAddress: z.string().min(1, 'Обязательное поле'),
  description: z.string().optional(),
});

type RouteFormValues = z.infer<typeof routeSchema>;

export function RoutesPage() {
  const { data: routes, isLoading } = useRoutes();
  const { data: contractors } = useContractors();
  const createRoute = useCreateRoute();
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<RouteFormValues>({
    resolver: zodResolver(routeSchema),
  });

  const onSubmit = (data: RouteFormValues) => {
    const body = {
      ...data,
      description: data.description || null,
    };
    createRoute.mutate(body, {
      onSuccess: () => {
        toast.success('Маршрут добавлен');
        setDialogOpen(false);
        reset();
      },
      onError: () => toast.error('Ошибка при создании'),
    });
  };

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <PageHeader title="Маршруты" />

      <DataTable
        columns={columns}
        data={routes ?? []}
        isLoading={isLoading}
        searchPlaceholder="Поиск маршрутов..."
        onCreateClick={() => setDialogOpen(true)}
        createLabel="Добавить"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый маршрут</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label>Отправитель</Label>
              <Controller
                name="senderContractorId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выберите..." />
                    </SelectTrigger>
                    <SelectContent>
                      {contractors?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.senderContractorId && (
                <p className="text-sm text-destructive">{errors.senderContractorId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Получатель</Label>
              <Controller
                name="receiverContractorId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выберите..." />
                    </SelectTrigger>
                    <SelectContent>
                      {contractors?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.receiverContractorId && (
                <p className="text-sm text-destructive">{errors.receiverContractorId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Адрес погрузки</Label>
              <Input {...register('loadingAddress')} placeholder="г. Москва, ул. ..." />
              {errors.loadingAddress && (
                <p className="text-sm text-destructive">{errors.loadingAddress.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Адрес выгрузки</Label>
              <Input {...register('unloadingAddress')} placeholder="г. Казань, ул. ..." />
              {errors.unloadingAddress && (
                <p className="text-sm text-destructive">{errors.unloadingAddress.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Описание (необязательно)</Label>
              <Textarea {...register('description')} placeholder="Дополнительная информация..." />
            </div>
            <Button type="submit" className="w-full" disabled={createRoute.isPending}>
              {createRoute.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
