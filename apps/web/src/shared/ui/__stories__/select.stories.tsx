import type { Meta, StoryObj } from '@storybook/react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../select';

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
};
export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-60">
        <SelectValue placeholder="Выберите статус" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="active">Активный</SelectItem>
        <SelectItem value="completed">Завершён</SelectItem>
        <SelectItem value="cancelled">Отменён</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const FilterSize: Story = {
  name: 'Размер фильтра (SM)',
  render: () => (
    <Select>
      <SelectTrigger size="sm" className="w-48">
        <SelectValue placeholder="Фильтр" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Все</SelectItem>
        <SelectItem value="today">Сегодня</SelectItem>
        <SelectItem value="week">За неделю</SelectItem>
      </SelectContent>
    </Select>
  ),
};
