import { AlertTriangle, X } from 'lucide-react';
import { useId } from 'react';
import { Button } from '../ui/Button';
import { useDialogFocus } from './useDialogFocus';

interface ConfirmationDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const titleId = useId();
  const { dialogRef } = useDialogFocus(true, onCancel);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
        className="w-full max-w-md rounded-[2rem] border border-bark/10 bg-white shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-bark/10 bg-sand px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
            }`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h2 id={titleId} className="text-lg font-semibold text-bark">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            data-dialog-initial-focus
            aria-label="Close dialog"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-bark/10 transition hover:bg-bark/5"
          >
            <X className="h-4 w-4 text-bark" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-sm leading-6 text-bark/70">{description}</p>
        </div>

        {/* Actions */}
        <div className="border-t border-bark/10 bg-sand px-6 py-4">
          <div className="flex gap-3 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
            <Button
              variant={variant === 'danger' ? 'danger' : 'primary'}
              size="sm"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Processing…' : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
