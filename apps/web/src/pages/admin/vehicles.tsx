import { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { CheckCircle, Wrench, Prohibit } from '@phosphor-icons/react';

import { PageHeader } from '@/widgets/page-header/ui';
import { DataTable, getSelectColumn } from '@/shared/ui/data-table';
import { DataTableColumnHeader } from '@/shared/ui/data-table/column-header';
import { RowActions, RowActionItem } from '@/shared/ui/data-table/row-actions';
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
import { OWNERSHIP_LABELS, VEHICLE_STATUS_LABELS } from '@/shared/config/constants';
import { useVehicles, useCreateVehicle, useUpdateVehicle, type Vehicle } from '@/entities/vehicle/api';
import { useUsers } from '@/entities/user/api';
import { useCargos } from '@/entities/cargo/api';

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  ACTIVE: 'success',
  IN_REPAIR: 'warning',
  INACTIVE: 'neutral',
};

const filterOptions = [
  {
    key: 'status',
    label: 'Статус',
    options: Object.entries(VEHICLE_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  },
];

const vehicleSchema = z.object({
  brand: z.string().min(1, 'Обязательное поле'),
  model: z.string().min(1, 'Обязательное поле'),
  licensePlate: z.string().min(1, 'Обязательное поле'),
  trailerPlate: z.string().optional(),
  ownershipType: z.string().min(1, 'Выберите тип владения'),
  assignedDriverId: z.string().optional(),
  allowedCargoIds: z.array(z.string()).optional(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

export function VehiclesPage() {
  const { data: vehicles, isLoading } = useVehicles();
  const { data: drivers } = useUsers({ role: 'DRIVER' });
  const { data: cargos } = useCargos();
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSetStatus = (id: string, status: 'ACTIVE' | 'IN_REPAIR' | 'INACTIVE') => {
    const labels: Record<'ACTIVE' | 'IN_REPAIR' | 'INACTIVE', string> = {
      ACTIVE: 'Машина активирована',
      IN_REPAIR: 'Машина отправлена на ремонт',
      INACTIVE: 'Машина деактивирована',
    };
    updateVehicle.mutate(
      { id, status },
      {
        onSuccess: () => toast.success(labels[status]),
        onError: () => toast.error('Не удалось обновить статус'),
      },
    );
  };

  const columns = useMemo<ColumnDef<Vehicle, any>[]>(() => [
    getSelectColumn<Vehicle>(),
    {
      accessorKey: 'brand',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Марка/Модель" />,
      cell: ({ row }) => `${row.original.brand} ${row.original.model}`,
    },
    {
      accessorKey: 'licensePlate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Госномер" />,
    },
    {
      accessorKey: 'trailerPlate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Прицеп" />,
      cell: ({ row }) => row.original.trailerPlate ?? '—',
    },
    {
      id: 'driver',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Водитель" />,
      accessorFn: (row) => row.assignedDriver?.fullName ?? '',
      cell: ({ row }) => row.original.assignedDriver?.fullName ?? '—',
    },
    {
      accessorKey: 'ownershipType',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Тип владения" />,
      cell: ({ row }) => OWNERSHIP_LABELS[row.original.ownershipType] ?? row.original.ownershipType,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Статус" />,
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.status] ?? 'neutral'}>
          {VEHICLE_STATUS_LABELS[row.original.status] ?? row.original.status}
        </Badge>
      ),
      filterFn: 'equals',
    },
    {
      id: 'actions',
      enableSorting: false,
      cell: ({ row }) => {
        const v = row.original;
        return (
          <RowActions>
            {v.status !== 'ACTIVE' && (
              <RowActionItem
                onClick={() => handleSetStatus(v.id, 'ACTIVE')}
                icon={CheckCircle}
                label="Активировать"
              />
            )}
            {v.status !== 'IN_REPAIR' && (
              <RowActionItem
                onClick={() => handleSetStatus(v.id, 'IN_REPAIR')}
                icon={Wrench}
                label="Отправить на ремонт"
              />
            )}
            {v.status !== 'INACTIVE' && (
              <RowActionItem
                onClick={() => handleSetStatus(v.id, 'INACTIVE')}
                icon={Prohibit}
                label="Деактивировать"
                variant="destructive"
              />
            )}
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
    setValue,
    watch,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: { allowedCargoIds: [] },
  });

  const selectedCargos = watch('allowedCargoIds') ?? [];

  const onSubmit = (data: VehicleFormValues) => {
    const body = {
      ...data,
      trailerPlate: data.trailerPlate || null,
      assignedDriverId: data.assignedDriverId || null,
      allowedCargoIds: data.allowedCargoIds?.length ? data.allowedCargoIds : undefined,
    };
    createVehicle.mutate(body, {
      onSuccess: () => {
        toast.success('Транспорт добавлен');
        setDialogOpen(false);
        reset();
      },
      onError: () => toast.error('Ошибка при создании'),
    });
  };

  const toggleCargo = (cargoId: string) => {
    const current = selectedCargos;
    if (current.includes(cargoId)) {
      setValue('allowedCargoIds', current.filter((id) => id !== cargoId));
    } else {
      setValue('allowedCargoIds', [...current, cargoId]);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <PageHeader title="Транспорт" />

      <DataTable
        columns={columns}
        data={vehicles ?? []}
        isLoading={isLoading}
        searchPlaceholder="Поиск транспорта..."
        filterOptions={filterOptions}
        onCreateClick={() => setDialogOpen(true)}
        createLabel="Добавить"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новое транспортное средство</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label>Марка</Label>
              <Input {...register('brand')} placeholder="КАМАЗ" />
              {errors.brand && <p className="text-sm text-destructive">{errors.brand.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Модель</Label>
              <Input {...register('model')} placeholder="65115" />
              {errors.model && <p className="text-sm text-destructive">{errors.model.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Госномер</Label>
              <Input {...register('licensePlate')} placeholder="А123БВ777" />
              {errors.licensePlate && <p className="text-sm text-destructive">{errors.licensePlate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Прицеп (необязательно)</Label>
              <Input {...register('trailerPlate')} placeholder="АА1234 77" />
            </div>
            <div className="space-y-2">
              <Label>Тип владения</Label>
              <Controller
                name="ownershipType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выберите..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(OWNERSHIP_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.ownershipType && <p className="text-sm text-destructive">{errors.ownershipType.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Водитель (необязательно)</Label>
              <Controller
                name="assignedDriverId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Не назначен" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Не назначен</SelectItem>
                      {drivers?.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Разрешённые грузы</Label>
              <div className="flex flex-wrap gap-2">
                {cargos?.map((cargo) => (
                  <label key={cargo.id} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedCargos.includes(cargo.id)}
                      onChange={() => toggleCargo(cargo.id)}
                      className="rounded border-input"
                    />
                    {cargo.name}
                  </label>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={createVehicle.isPending}>
              {createVehicle.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
