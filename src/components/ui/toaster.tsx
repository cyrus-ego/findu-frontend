'use client';

import * as DialogPrimitives from '@radix-ui/react-dialog';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';

export function Toaster() {
  const { toasts, errorDialog, dismissError } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />

      <DialogPrimitives.Root
        open={!!errorDialog}
        onOpenChange={(open) => {
          if (!open) dismissError(errorDialog?.id);
        }}
      >
        <DialogPrimitives.Portal>
          <DialogPrimitives.Overlay className="fixed inset-0 z-[200] bg-background/70 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitives.Content className="fixed left-1/2 top-1/2 z-[201] grid w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 gap-5 rounded-lg border bg-background p-6 text-foreground shadow-xl focus:outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <DialogPrimitives.Title className="text-base font-semibold">
                  {errorDialog?.title || 'Có lỗi xảy ra'}
                </DialogPrimitives.Title>
                {errorDialog?.description && (
                  <DialogPrimitives.Description className="break-words text-sm text-muted-foreground">
                    {errorDialog.description}
                  </DialogPrimitives.Description>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={() => dismissError(errorDialog?.id)}>
                OK
              </Button>
            </div>
          </DialogPrimitives.Content>
        </DialogPrimitives.Portal>
      </DialogPrimitives.Root>
    </ToastProvider>
  );
}
