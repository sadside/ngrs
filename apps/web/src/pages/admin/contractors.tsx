import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

import { PageHeader } from '@/widgets/page-header/ui';
import { DataTable, getSelectColumn } from '@/shared/ui/data-table';
import { RowActions } from '@/shared/ui/data-table/row-actions';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

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
import { CONTRACTOR_TYPE_LABELS } from '@/shared/config/constants';
import { useContractors, useCreateContractor, type Contractor } from '@/entities/contractor/api';

const typeVariant: Record<string, 'info' | 'success' | 'warning'> = {
  SENDER: 'info',
  RECEIVER: 'success',
  BOTH: 'warning',
};

const columns: ColumnDef<Contractor, any>[] = [
  getSelectColumn<Contractor>(),
  {
    accessorKey: 'name',
    header: 'Название',
  },
  {
    accessorKey: 'inn',
    header: 'ИНН',
    cell: ({ row }) => row.original.inn ?? '—',
  },
  {
    accessorKey: 'type',
    header: 'Тип',
    cell: ({ row }) => (
      <Badge variant={typeVariant[row.original.type] ?? 'neutral'}>
        {CONTRACTOR_TYPE_LABELS[row.original.type] ?? row.original.type}
      </Badge>
    ),
    filterFn: 'equals',
  },
  {
    accessorKey: 'contactPhone',
    header: 'Телефон',
    cell: ({ row }) => row.original.contactPhone ?? '—',
  },
  {
    accessorKey: 'contactPerson',
    header: 'Контактное лицо',
    cell: ({ row }) => row.original.contactPerson ?? '—',
  },
  {
    id: 'actions',
    cell: () => (
      <RowActions
        onDelete={() => toast.info('Функция удаления будет добавлена позже')}
      />
    ),
    size: 50,
  },
];

const filterOptions = [
  {
    key: 'type',
    label: 'Тип',
    options: Object.entries(CONTRACTOR_TYPE_LABELS).map(([value, label]) => ({ value, label })),
  },
];

const contractorSchema = z.object({
  name: z.string().min(1, 'Обязательное поле'),
  inn: z.string().optional(),
  type: z.string().min(1, 'Выберите тип'),
  legalAddress: z.string().optional(),
  actualAddress: z.string().optional(),
  contactPhone: z.string().optional(),
  contactPerson: z.string().optional(),
});

type ContractorFormValues = z.infer<typeof contractorSchema>;

export function ContractorsPage() {
  const { data: contractors, isLoading } = useContractors();
  const createContractor = useCreateContractor();
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ContractorFormValues>({
    resolver: zodResolver(contractorSchema),
  });

  const onSubmit = (data: ContractorFormValues) => {
    const body = {
      ...data,
      inn: data.inn || null,
      legalAddress: data.legalAddress || null,
      actualAddress: data.actualAddress || null,
      contactPhone: data.contactPhone || null,
      contactPerson: data.contactPerson || null,
    };
    createContractor.mutate(body, {
      onSuccess: () => {
        toast.success('Контрагент добавлен');
        setDialogOpen(false);
        reset();
      },
      onError: () => toast.error('Ошибка при создании'),
    });
  };

  return (
    <div className="flex flex-col flex-1">
      <PageHeader title="Контрагенты" />

      <DataTable
        columns={columns}
        data={contractors ?? []}
        isLoading={isLoading}
        searchPlaceholder="Поиск контрагентов..."
        filterOptions={filterOptions}
        onCreateClick={() => setDialogOpen(true)}
        createLabel="Добавить"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый контрагент</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input {...register('name')} placeholder="ООО Компания" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>ИНН (необязательно)</Label>
              <Input {...register('inn')} placeholder="1234567890" />
            </div>
            <div className="space-y-2">
              <Label>Тип</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выберите..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CONTRACTOR_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Юридический адрес (необязательно)</Label>
              <Input {...register('legalAddress')} />
            </div>
            <div className="space-y-2">
              <Label>Фактический адрес (необязательно)</Label>
              <Input {...register('actualAddress')} />
            </div>
            <div className="space-y-2">
              <Label>Телефон (необязательно)</Label>
              <Input {...register('contactPhone')} placeholder="+7..." />
            </div>
            <div className="space-y-2">
              <Label>Контактное лицо (необязательно)</Label>
              <Input {...register('contactPerson')} />
            </div>
            <Button type="submit" className="w-full" disabled={createContractor.isPending}>
              {createContractor.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
