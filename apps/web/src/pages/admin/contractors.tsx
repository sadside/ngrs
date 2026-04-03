import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus } from '@phosphor-icons/react';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

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
import { useContractors, useCreateContractor } from '@/entities/contractor/api';

const CONTRACTOR_TYPE_LABELS: Record<string, string> = {
  SENDER: 'Грузоотправитель',
  RECEIVER: 'Грузополучатель',
  BOTH: 'Оба',
};

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
  const [deleteTarget, setDeleteTarget] = useState<{id: string; name: string} | null>(null);

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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex-1" />
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary-500 hover:bg-primary-600 text-white cursor-pointer">
              <Plus size={18} className="mr-2" /> Добавить
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый контрагент</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div className="space-y-2">
                <Label>Название</Label>
                <Input {...register('name')} placeholder="ООО Компания" />
                {errors.name && <p className="text-sm text-danger">{errors.name.message}</p>}
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
                {errors.type && <p className="text-sm text-danger">{errors.type.message}</p>}
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
              <Button type="submit" className="w-full bg-primary-500 hover:bg-primary-600 text-white cursor-pointer" disabled={createContractor.isPending}>
                {createContractor.isPending ? 'Создание...' : 'Создать'}
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
              <TableHead>Название</TableHead>
              <TableHead>ИНН</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Контактное лицо</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contractors?.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.inn ?? '—'}</TableCell>
                <TableCell>{CONTRACTOR_TYPE_LABELS[c.type] ?? c.type}</TableCell>
                <TableCell>{c.contactPhone ?? '—'}</TableCell>
                <TableCell>{c.contactPerson ?? '—'}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="cursor-pointer"
                    onClick={() => setDeleteTarget({ id: c.id, name: c.name })}
                  >
                    Удалить
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {contractors?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Нет данных
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение удаления</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            Вы действительно хотите удалить <span className="font-medium text-foreground">{deleteTarget?.name}</span>?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="cursor-pointer">
              Отмена
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer"
              onClick={() => {
                toast.info('Функция удаления будет добавлена позже');
                setDeleteTarget(null);
              }}
            >
              Удалить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
