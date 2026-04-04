import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Pagination } from '../pagination';

const meta: Meta<typeof Pagination> = {
  title: 'UI/Pagination',
  component: Pagination,
};
export default meta;
type Story = StoryObj<typeof Pagination>;

const PaginationWrapper = ({ totalPages, initialPage = 1 }: { totalPages: number; initialPage?: number }) => {
  const [page, setPage] = useState(initialPage);
  return <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />;
};

export const FewPages: Story = {
  name: 'Мало страниц (3)',
  render: () => <PaginationWrapper totalPages={3} />,
};

export const ManyPages: Story = {
  name: 'Много страниц (10)',
  render: () => <PaginationWrapper totalPages={10} />,
};

export const FirstPage: Story = {
  name: 'Первая страница',
  render: () => <PaginationWrapper totalPages={10} initialPage={1} />,
};

export const LastPage: Story = {
  name: 'Последняя страница',
  render: () => <PaginationWrapper totalPages={10} initialPage={10} />,
};
