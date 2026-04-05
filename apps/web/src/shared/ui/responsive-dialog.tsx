import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/shared/ui/sheet';
import { useMediaQuery } from '@/shared/lib/use-media-query';
import { cn } from '@/shared/lib/utils';

const DESKTOP_QUERY = '(min-width: 768px)';

interface ResponsiveDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function ResponsiveDialog({ open, onOpenChange, children }: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {children}
      </Dialog>
    );
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {children}
    </Sheet>
  );
}

interface ResponsiveDialogContentProps extends React.ComponentProps<'div'> {
  className?: string;
}

export function ResponsiveDialogContent({
  className,
  children,
  ...props
}: ResponsiveDialogContentProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  if (isDesktop) {
    return (
      <DialogContent className={className} {...props}>
        {children}
      </DialogContent>
    );
  }
  return (
    <SheetContent
      side="bottom"
      className={cn(
        'flex flex-col rounded-t-2xl max-h-[92vh] p-0 gap-0',
        className,
      )}
      {...props}
    >
      <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-muted" aria-hidden="true" />
      {children}
    </SheetContent>
  );
}

export function ResponsiveDialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  if (isDesktop) {
    return <DialogHeader className={className} {...props} />;
  }
  return (
    <SheetHeader className={cn('sticky top-0 bg-background border-b border-border p-4 z-10', className)} {...props} />
  );
}

export function ResponsiveDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogTitle>) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  if (isDesktop) {
    return <DialogTitle className={className} {...props} />;
  }
  return <SheetTitle className={className} {...props} />;
}

export function ResponsiveDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogDescription>) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  if (isDesktop) {
    return <DialogDescription className={className} {...props} />;
  }
  return <SheetDescription className={className} {...props} />;
}

export function ResponsiveDialogBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex-1 overflow-y-auto p-4 md:p-0 md:pt-2',
        className,
      )}
      {...props}
    />
  );
}

export function ResponsiveDialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  if (isDesktop) {
    return <DialogFooter className={className} {...props} />;
  }
  return (
    <SheetFooter
      className={cn('sticky bottom-0 bg-background border-t border-border p-4', className)}
      {...props}
    />
  );
}
