import { useState } from 'react';
import { useForm } from 'react-hook-form';
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

  const {
    register,
    handleSubmit,
    reset,
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
      <div className="flex items-center justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={18} className="mr-2" /> Добавить
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый контрагент</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                <select
                  {...register('type')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Выберите...</option>
                  {Object.entries(CONTRACTOR_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
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
              <Button type="submit" className="w-full" disabled={createContractor.isPending}>
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
              </TableRow>
            ))}
            {contractors?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
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
