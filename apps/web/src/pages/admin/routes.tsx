import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus } from '@phosphor-icons/react';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
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
              <DialogTitle>Новый маршрут</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Отправитель</Label>
                <Controller
                  name="senderContractorId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full bg-white">
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
                  <p className="text-sm text-danger">{errors.senderContractorId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Получатель</Label>
                <Controller
                  name="receiverContractorId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full bg-white">
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
                  <p className="text-sm text-danger">{errors.receiverContractorId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Адрес погрузки</Label>
                <Input {...register('loadingAddress')} placeholder="г. Москва, ул. ..." className="bg-white" />
                {errors.loadingAddress && (
                  <p className="text-sm text-danger">{errors.loadingAddress.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Адрес выгрузки</Label>
                <Input {...register('unloadingAddress')} placeholder="г. Казань, ул. ..." className="bg-white" />
                {errors.unloadingAddress && (
                  <p className="text-sm text-danger">{errors.unloadingAddress.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Описание (необязательно)</Label>
                <Textarea {...register('description')} placeholder="Дополнительная информация..." className="bg-white" />
              </div>
              <Button type="submit" className="w-full bg-primary-500 hover:bg-primary-600 text-white cursor-pointer" disabled={createRoute.isPending}>
                {createRoute.isPending ? 'Создание...' : 'Создать'}
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
                <TableHead className="text-secondary-500 font-medium text-xs uppercase tracking-wider">Отправитель</TableHead>
                <TableHead className="text-secondary-500 font-medium text-xs uppercase tracking-wider">Получатель</TableHead>
                <TableHead className="text-secondary-500 font-medium text-xs uppercase tracking-wider">Адрес погрузки</TableHead>
                <TableHead className="text-secondary-500 font-medium text-xs uppercase tracking-wider">Адрес выгрузки</TableHead>
                <TableHead className="text-secondary-500 font-medium text-xs uppercase tracking-wider">Описание</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes?.map((r) => (
                <TableRow key={r.id} className="hover:bg-secondary-50/50">
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
        </Card>
      )}
    </div>
  );
}
