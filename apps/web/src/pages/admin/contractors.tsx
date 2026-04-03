import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus } from '@phosphor-icons/react';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card } from '@/shared/ui/card';
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
      <div className="flex items-center justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary-500 hover:bg-primary-600 text-white">
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
                <Input {...register('name')} placeholder="ООО Компания" className="bg-white" />
                {errors.name && <p className="text-sm text-danger">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>ИНН (необязательно)</Label>
                <Input {...register('inn')} placeholder="1234567890" className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label>Тип</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full bg-white">
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
                <Input {...register('legalAddress')} className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label>Фактический адрес (необязательно)</Label>
                <Input {...register('actualAddress')} className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label>Телефон (необязательно)</Label>
                <Input {...register('contactPhone')} placeholder="+7..." className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label>Контактное лицо (необязательно)</Label>
                <Input {...register('contactPerson')} className="bg-white" />
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
        <Card className="bg-white rounded-xl shadow-sm border border-secondary-100">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary-50 hover:bg-secondary-50">
                <TableHead className="text-secondary-500 font-medium text-xs uppercase tracking-wider">Название</TableHead>
                <TableHead className="text-secondary-500 font-medium text-xs uppercase tracking-wider">ИНН</TableHead>
                <TableHead className="text-secondary-500 font-medium text-xs uppercase tracking-wider">Тип</TableHead>
                <TableHead className="text-secondary-500 font-medium text-xs uppercase tracking-wider">Телефон</TableHead>
                <TableHead className="text-secondary-500 font-medium text-xs uppercase tracking-wider">Контактное лицо</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contractors?.map((c) => (
                <TableRow key={c.id} className="hover:bg-secondary-50/50">
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
        </Card>
      )}
    </div>
  );
}
