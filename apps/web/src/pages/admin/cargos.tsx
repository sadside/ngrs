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
import { useCargos, useCreateCargo } from '@/entities/cargo/api';

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
  const [deleteTarget, setDeleteTarget] = useState<{id: string; name: string} | null>(null);

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
              <DialogTitle>Новый груз</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div className="space-y-2">
                <Label>Название</Label>
                <Input {...register('name')} placeholder="Бензин АИ-92" />
                {errors.name && <p className="text-sm text-danger">{errors.name.message}</p>}
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
              <Button type="submit" className="w-full bg-primary-500 hover:bg-primary-600 text-white cursor-pointer" disabled={createCargo.isPending}>
                {createCargo.isPending ? 'Создание...' : 'Создать'}
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
              <TableHead>ТУ</TableHead>
              <TableHead>UN код</TableHead>
              <TableHead>Класс опасности</TableHead>
              <TableHead>Упаковка</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargos?.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.technicalSpec ?? '—'}</TableCell>
                <TableCell>{c.unCode ?? '—'}</TableCell>
                <TableCell>{c.hazardClass ?? '—'}</TableCell>
                <TableCell>{c.packagingMethod ?? '—'}</TableCell>
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
            {cargos?.length === 0 && (
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
