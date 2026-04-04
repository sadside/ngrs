import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs';

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
};
export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTrigger value="all">Все рейсы</TabsTrigger>
        <TabsTrigger value="active">Активные</TabsTrigger>
        <TabsTrigger value="completed">Завершённые</TabsTrigger>
      </TabsList>
      <TabsContent value="all">
        <p className="text-sm text-muted-foreground p-4">Список всех рейсов</p>
      </TabsContent>
      <TabsContent value="active">
        <p className="text-sm text-muted-foreground p-4">Активные рейсы</p>
      </TabsContent>
      <TabsContent value="completed">
        <p className="text-sm text-muted-foreground p-4">Завершённые рейсы</p>
      </TabsContent>
    </Tabs>
  ),
};

export const Pill: Story = {
  name: 'Вариант Pill',
  render: () => (
    <Tabs defaultValue="overview">
      <TabsList variant="pill">
        <TabsTrigger variant="pill" value="overview">Обзор</TabsTrigger>
        <TabsTrigger variant="pill" value="analytics">Аналитика</TabsTrigger>
        <TabsTrigger variant="pill" value="reports">Отчёты</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p className="text-sm text-muted-foreground p-4">Обзор данных</p>
      </TabsContent>
      <TabsContent value="analytics">
        <p className="text-sm text-muted-foreground p-4">Аналитика</p>
      </TabsContent>
      <TabsContent value="reports">
        <p className="text-sm text-muted-foreground p-4">Отчёты</p>
      </TabsContent>
    </Tabs>
  ),
};
