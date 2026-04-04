import type { Meta, StoryObj } from '@storybook/react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../dropdown-menu';
import { Button } from '../button';
import { Eye, PencilSimple, Trash } from '@phosphor-icons/react';

const meta: Meta<typeof DropdownMenu> = {
  title: 'UI/DropdownMenu',
  component: DropdownMenu,
};
export default meta;
type Story = StoryObj<typeof DropdownMenu>;

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Действия</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <Eye size={16} />
          Просмотреть
        </DropdownMenuItem>
        <DropdownMenuItem>
          <PencilSimple size={16} />
          Редактировать
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Trash size={16} />
          Удалить
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
