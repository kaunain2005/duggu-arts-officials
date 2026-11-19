'use client';

import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/formatting';

type ToastProps = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
  onOpenChange?: (open: boolean) => void;
};

function Toast({ id, title, description, action, variant = 'default', onOpenChange }: ToastProps) {
  const { dismiss } = useToast();

  const handleClose = () => {
    onOpenChange?.(false);
    dismiss(id);
  };

  return (
    <div
      className={cn(
        'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full',
        'data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
        variant === 'destructive'
          ? 'border-destructive bg-destructive text-destructive-foreground'
          : 'bg-background text-foreground border'
      )}
    >
      <div className="grid gap-1">
        {title && <div className="text-sm font-semibold">{title}</div>}
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>
      {action}
      <button
        className={cn(
          'text-foreground/50 hover:text-foreground absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100',
          variant === 'destructive' &&
            'group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50'
        )}
        onClick={handleClose}
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function ToastViewport({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {children}
    </div>
  );
}

interface ToastProviderProps {
  children: React.ReactNode;
}

function ToastProvider({ children }: ToastProviderProps) {
  return <>{children}</>;
}

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      <ToastViewport>
        {toasts.map(({ id, title, description, action, variant, onOpenChange }) => (
          <Toast
            key={id}
            id={id}
            title={title}
            description={description}
            action={action}
            variant={variant}
            onOpenChange={onOpenChange}
          />
        ))}
      </ToastViewport>
    </ToastProvider>
  );
}
