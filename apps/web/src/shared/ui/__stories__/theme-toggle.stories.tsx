import type { Meta, StoryObj } from '@storybook/react';
import { ThemeToggle } from '../theme-toggle';
import { ThemeProvider } from '@/shared/lib/theme';
import type { ReactNode } from 'react';

const ThemeDecorator = (Story: () => ReactNode) => (
  <ThemeProvider>
    <Story />
  </ThemeProvider>
);

const meta: Meta<typeof ThemeToggle> = {
  title: 'UI/ThemeToggle',
  component: ThemeToggle,
  decorators: [ThemeDecorator],
  argTypes: {
    collapsed: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof ThemeToggle>;

export const Expanded: Story = {
  args: { collapsed: false },
  name: 'Развёрнутый',
};

export const Collapsed: Story = {
  args: { collapsed: true },
  name: 'Свёрнутый',
};
