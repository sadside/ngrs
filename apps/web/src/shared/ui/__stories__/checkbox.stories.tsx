import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from '../checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'UI/Checkbox',
  component: Checkbox,
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Unchecked: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="unchecked" />
      <label htmlFor="unchecked" className="text-sm text-foreground">Не выбрано</label>
    </div>
  ),
};

export const Checked: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="checked" defaultChecked />
      <label htmlFor="checked" className="text-sm text-foreground">Выбрано</label>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="disabled" disabled />
      <label htmlFor="disabled" className="text-sm text-muted-foreground">Недоступно</label>
    </div>
  ),
};
