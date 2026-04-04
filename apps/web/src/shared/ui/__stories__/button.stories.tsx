import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../button';
import { Plus, Trash } from '@phosphor-icons/react';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'outline', 'ghost', 'danger', 'link'] },
    size: { control: 'select', options: ['sm', 'md', 'lg', 'icon', 'icon-sm'] },
    disabled: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { children: 'Создать рейс', variant: 'primary' } };
export const Secondary: Story = { args: { children: 'Отмена', variant: 'secondary' } };
export const Outline: Story = { args: { children: 'Подробнее', variant: 'outline' } };
export const Ghost: Story = { args: { children: 'Назад', variant: 'ghost' } };
export const Danger: Story = { args: { children: 'Удалить', variant: 'danger' } };
export const WithIcon: Story = {
  args: { variant: 'primary' },
  render: (args) => (
    <Button {...args}>
      <Plus size={18} /> Добавить
    </Button>
  ),
};
export const IconOnly: Story = {
  args: { variant: 'danger', size: 'icon' },
  render: (args) => (
    <Button {...args}>
      <Trash size={18} />
    </Button>
  ),
};
export const Disabled: Story = { args: { children: 'Недоступна', disabled: true } };
