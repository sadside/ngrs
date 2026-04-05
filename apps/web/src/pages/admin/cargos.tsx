import { useState } from 'react';
import { useForm } from 'react-hook-form';
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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { useCargos, useCreateCargo, type Cargo } from '@/entities/cargo/api';

const columns: ColumnDef<Cargo, any>[] = [
  getSelectColumn<Cargo>(),
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Название" />,
  },
  {
    accessorKey: 'technicalSpec',
    header: ({ column }) => <DataTableColumnHeader column={column} title="ТУ" />,
    cell: ({ row }) => row.original.technicalSpec ?? '—',
  },
  {
    accessorKey: 'unCode',
    header: ({ column }) => <DataTableColumnHeader column={column} title="UN код" />,
    cell: ({ row }) => row.original.unCode ?? '—',
  },
  {
    accessorKey: 'hazardClass',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Класс опасности" />,
    cell: ({ row }) => row.original.hazardClass ?? '—',
  },
  {
    accessorKey: 'packagingMethod',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Упаковка" />,
    cell: ({ row }) => row.original.packagingMethod ?? '—',
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

const cargoSchema = z.object({
  name: z.string().min(1, 'Обязательное поле'),
  technicalSpec: z.string().optional(),
  unCode: z.string().optional(),
  hazardClass: z.string().optional(),
  packagingMethod: z.string().optional(),
});

type CargoFormValues = z.infer<typeof cargoSchema>;

export function CargosPage() {
  const { data: cargos, isLoading } = useCargos();
  const createCargo = useCreateCargo();
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CargoFormValues>({
    resolver: zodResolver(cargoSchema),
  });

  const onSubmit = (data: CargoFormValues) => {
    const body = {
      ...data,
      technicalSpec: data.technicalSpec || null,
      unCode: data.unCode || null,
      hazardClass: data.hazardClass || null,
      packagingMethod: data.packagingMethod || null,
    };
    createCargo.mutate(body, {
      onSuccess: () => {
        toast.success('Груз добавлен');
        setDialogOpen(false);
        reset();
      },
      onError: () => toast.error('Ошибка при создании'),
    });
  };

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <PageHeader title="Грузы" />

      <DataTable
        columns={columns}
        data={cargos ?? []}
        isLoading={isLoading}
        searchPlaceholder="Поиск грузов..."
        onCreateClick={() => setDialogOpen(true)}
        createLabel="Добавить"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый груз</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input {...register('name')} placeholder="Бензин АИ-92" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>ТУ (необязательно)</Label>
              <Input {...register('technicalSpec')} placeholder="ГОСТ 32513-2013" />
            </div>
            <div className="space-y-2">
              <Label>UN код (необязательно)</Label>
              <Input {...register('unCode')} placeholder="1203" />
            </div>
            <div className="space-y-2">
              <Label>Класс опасности (необязательно)</Label>
              <Input {...register('hazardClass')} placeholder="3" />
            </div>
            <div className="space-y-2">
              <Label>Упаковка (необязательно)</Label>
              <Input {...register('packagingMethod')} placeholder="Цистерна" />
            </div>
            <Button type="submit" className="w-full" disabled={createCargo.isPending}>
              {createCargo.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
