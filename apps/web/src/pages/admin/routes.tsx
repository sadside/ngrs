import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus } from '@phosphor-icons/react';

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

  const {
    register,
    handleSubmit,
    reset,
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Маршруты</h1>
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Отправитель</Label>
                <select
                  {...register('senderContractorId')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Выберите...</option>
                  {contractors?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.senderContractorId && (
                  <p className="text-sm text-danger">{errors.senderContractorId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Получатель</Label>
                <select
                  {...register('receiverContractorId')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Выберите...</option>
                  {contractors?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.receiverContractorId && (
                  <p className="text-sm text-danger">{errors.receiverContractorId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Адрес погрузки</Label>
                <Input {...register('loadingAddress')} placeholder="г. Москва, ул. ..." />
                {errors.loadingAddress && (
                  <p className="text-sm text-danger">{errors.loadingAddress.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Адрес выгрузки</Label>
                <Input {...register('unloadingAddress')} placeholder="г. Казань, ул. ..." />
                {errors.unloadingAddress && (
                  <p className="text-sm text-danger">{errors.unloadingAddress.message}</p>
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
              </TableRow>
            ))}
            {routes?.length === 0 && (
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
