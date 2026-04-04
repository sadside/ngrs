import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../card';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  argTypes: {
    variant: { control: 'select', options: ['default', 'stats', 'dark'] },
  },
};
export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: (args) => (
    <Card {...args} className="w-80">
      <CardHeader>
        <CardTitle>Рейс #1234</CardTitle>
        <CardDescription>Москва - Санкт-Петербург</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Дата отправления: 15.04.2026</p>
      </CardContent>
    </Card>
  ),
  args: { variant: 'default' },
};

export const Stats: Story = {
  render: (args) => (
    <Card {...args} className="w-60">
      <p className="text-sm text-muted-foreground">Всего рейсов</p>
      <p className="text-2xl font-bold">1 247</p>
    </Card>
  ),
  args: { variant: 'stats' },
};

export const Dark: Story = {
  render: (args) => (
    <Card {...args} className="w-60 p-4">
      <p className="text-sm opacity-80">Выручка за месяц</p>
      <p className="text-2xl font-bold">2 450 000 &#8381;</p>
    </Card>
  ),
  args: { variant: 'dark' },
};
