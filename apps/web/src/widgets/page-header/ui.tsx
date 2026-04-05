import { UserPopover } from '@/shared/ui/user-popover';

interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5 truncate">{description}</p>
        )}
      </div>
      <div className="hidden md:block">
        <UserPopover />
      </div>
    </div>
  );
}
