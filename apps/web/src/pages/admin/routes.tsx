import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { ColumnDef, Row } from '@tanstack/react-table';

import { PageHeader } from '@/widgets/page-header/ui';
import { DataTable, getSelectColumn } from '@/shared/ui/data-table';
import { DataTableColumnHeader } from '@/shared/ui/data-table/column-header';
import { RowActions } from '@/shared/ui/data-table/row-actions';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from '@/shared/ui/responsive-dialog';
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

function renderRouteCard(row: Row<Route>) {
  const r = row.original;
  return (
    <Card className="p-4 gap-3">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-input"
          aria-label="Выбрать"
        />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground break-words">
            {r.senderContractor.name} → {r.receiverContractor.name}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 text-xs">
        <div>
          <div className="text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Адрес погрузки</div>
          <div className="text-foreground text-sm break-words leading-snug">{r.loadingAddress}</div>
        </div>
        <div>
          <div className="text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Адрес выгрузки</div>
          <div className="text-foreground text-sm break-words leading-snug">{r.unloadingAddress}</div>
        </div>
        {r.description && (
          <div>
            <div className="text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Описание</div>
            <div className="text-foreground text-sm break-words leading-snug">{r.description}</div>
          </div>
        )}
      </div>
    </Card>
  );
}

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
        mobileCardRenderer={renderRouteCard}
      />

      <ResponsiveDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <ResponsiveDialogContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col flex-1 min-h-0">
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle>Новый маршрут</ResponsiveDialogTitle>
            </ResponsiveDialogHeader>
            <ResponsiveDialogBody className="space-y-4">
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
            </ResponsiveDialogBody>
            <ResponsiveDialogFooter>
              <Button type="submit" className="w-full" disabled={createRoute.isPending}>
                {createRoute.isPending ? 'Создание...' : 'Создать'}
              </Button>
            </ResponsiveDialogFooter>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}
