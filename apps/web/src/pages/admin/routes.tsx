import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus } from '@phosphor-icons/react';

import { PageHeader } from '@/widgets/page-header/ui';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

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
import { useRoutes, useCreateRoute } from '@/entities/route/api';
import { useContractors } from '@/entities/contractor/api';

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
  const [deleteTarget, setDeleteTarget] = useState<{id: string; name: string} | null>(null);

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
    <div className="flex flex-col flex-1 gap-4">
      <PageHeader title="Маршруты" />
      <div className="flex items-center gap-3">
        <div className="flex-1" />
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={18} className="mr-2" /> Добавить
            </Button>
          </DialogTrigger>
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

      {isLoading ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Отправитель</TableHead>
              <TableHead>Получатель</TableHead>
              <TableHead>Адрес погрузки</TableHead>
              <TableHead>Адрес выгрузки</TableHead>
              <TableHead>Описание</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {routes?.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.senderContractor.name}</TableCell>
                <TableCell>{r.receiverContractor.name}</TableCell>
                <TableCell>{r.loadingAddress}</TableCell>
                <TableCell>{r.unloadingAddress}</TableCell>
                <TableCell>{r.description ?? '—'}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setDeleteTarget({ id: r.id, name: `${r.senderContractor.name} → ${r.receiverContractor.name}` })}
                  >
                    Удалить
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {routes?.length === 0 && (
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
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Отмена
            </Button>
            <Button
              variant="danger"
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
