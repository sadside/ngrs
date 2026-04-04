import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '../badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  argTypes: {
    variant: { control: 'select', options: ['success', 'warning', 'danger', 'info', 'neutral'] },
    size: { control: 'select', options: ['sm', 'md'] },
  },
};
export default meta;
type Story = StoryObj<typeof Badge>;

export const Success: Story = { args: { children: 'Завершён', variant: 'success' } };
export const Warning: Story = { args: { children: 'В ожидании', variant: 'warning' } };
export const Danger: Story = { args: { children: 'Отменён', variant: 'danger' } };
export const Info: Story = { args: { children: 'В пути', variant: 'info' } };
export const Neutral: Story = { args: { children: 'Черновик', variant: 'neutral' } };
export const Small: Story = {
  args: { children: 'Маленький', variant: 'success', size: 'sm' },
  name: 'Маленький размер',
};
