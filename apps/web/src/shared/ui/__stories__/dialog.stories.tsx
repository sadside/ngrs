import type { Meta, StoryObj } from '@storybook/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../dialog';
import { Button } from '../button';
import { Input } from '../input';

const meta: Meta<typeof Dialog> = {
  title: 'UI/Dialog',
  component: Dialog,
};
export default meta;
type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
  render: () => (
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать рейс</DialogTitle>
          <DialogDescription>
            Заполните данные для создания нового рейса
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input placeholder="Откуда" />
          <Input placeholder="Куда" />
        </div>
        <DialogFooter>
          <Button variant="outline">Отмена</Button>
          <Button variant="primary">Создать</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
