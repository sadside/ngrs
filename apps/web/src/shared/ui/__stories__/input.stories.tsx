import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '../input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  argTypes: {
    variant: { control: 'select', options: ['default', 'search'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { placeholder: 'Введите значение' },
};
export const Search: Story = {
  args: { variant: 'search', placeholder: 'Поиск по рейсам...' },
};
export const SizeSm: Story = {
  args: { size: 'sm', placeholder: 'Маленький' },
  name: 'Размер SM',
};
export const SizeMd: Story = {
  args: { size: 'md', placeholder: 'Средний' },
  name: 'Размер MD',
};
export const SizeLg: Story = {
  args: { size: 'lg', placeholder: 'Большой' },
  name: 'Размер LG',
};
export const Disabled: Story = {
  args: { placeholder: 'Недоступно', disabled: true },
};
export const WithPlaceholder: Story = {
  args: { placeholder: 'Номер транспортного средства' },
  name: 'С подсказкой',
};
