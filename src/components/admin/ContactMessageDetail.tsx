import { Copy, Mail, Phone, X } from 'lucide-react';
import { useState, useId } from 'react';
import { type ContactMessage } from '../../hooks/useContactMessages';
import { ContactStatusBadge } from './ContactStatusBadge';
import { Button } from '../ui/Button';
import { useDialogFocus } from './useDialogFocus';

interface ContactMessageDetailProps {
  message: ContactMessage;
  onClose: () => void;
  onMarkRead?: () => void;
  onMarkReplied?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

export function ContactMessageDetail({
  message,
  onClose,
  onMarkRead,
  onMarkReplied,
  onArchive,
  onDelete,
}: ContactMessageDetailProps) {
  const [_copiedField, setCopiedField] = useState<string | null>(null);
  const titleId = useId();
  const { dialogRef } = useDialogFocus(true, onClose);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      setCopiedField(null);
    }
  };

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(dateString));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-bark/10 bg-white shadow-lg"
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-bark/10 bg-sand px-6 py-4">
          <div>
            <h2 id={titleId} className="text-xl font-semibold text-bark">Message Details</h2>
            <p className="mt-1 text-sm text-bark/70">From {message.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close message details"
            data-dialog-initial-focus
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-bark/10 transition hover:bg-bark/5 focus:outline-none focus-visible:ring-4 focus-visible:ring-oak-200"
          >
            <X className="h-5 w-5 text-bark" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Status and Meta */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-bark/70">Status</p>
              <div className="mt-2">
                <ContactStatusBadge status={message.status} />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-bark/70">Received</p>
              <p className="mt-2 text-sm text-bark">{formatDate(message.created_at)}</p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4 border-t border-bark/10 pt-6">
            <h3 className="text-sm font-semibold text-bark">Contact Information</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Name */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-bark/70">Name</p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-sm text-bark">{message.name}</p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(message.name, 'name')}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-bark/10 transition hover:bg-sand focus:outline-none focus-visible:ring-4 focus-visible:ring-oak-200"
                    title="Copy name"
                  >
                    <Copy className="h-4 w-4 text-bark/60" />
                  </button>
                </div>
              </div>

              {/* Email */}
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-bark/70">
                  <Mail className="h-3 w-3" aria-hidden="true" />
                  <span>Email</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <a href={`mailto:${message.email}`} className="text-sm text-oak-600 hover:underline">
                    {message.email}
                  </a>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(message.email, 'email')}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-bark/10 transition hover:bg-sand"
                    title="Copy email"
                  >
                    <Copy className="h-4 w-4 text-bark/60" />
                  </button>
                </div>
              </div>

              {/* Phone */}
              {message.phone && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-bark/70">
                    <Phone className="h-3 w-3" aria-hidden="true" />
                    <span>Phone</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <a href={`tel:${message.phone}`} className="text-sm text-oak-600 hover:underline">
                      {message.phone}
                    </a>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(message.phone!, 'phone')}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-bark/10 transition hover:bg-sand"
                      title="Copy phone"
                    >
                      <Copy className="h-4 w-4 text-bark/60" />
                    </button>
                  </div>
                </div>
              )}

              {/* Subject */}
              {message.subject && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-bark/70">Subject</p>
                  <p className="mt-2 text-sm text-bark">{message.subject}</p>
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-3 border-t border-bark/10 pt-6">
            <h3 className="text-sm font-semibold text-bark">Message</h3>
            <div className="rounded-lg border border-bark/10 bg-sand p-4">
              <p className="whitespace-pre-wrap text-sm leading-6 text-bark">{message.message || 'No message provided'}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-bark/10 bg-sand px-6 py-4">
          <div className="flex flex-wrap gap-3 sm:justify-end">
            {message.status === 'new' && onMarkRead && (
              <Button variant="secondary" size="sm" onClick={onMarkRead}>
                Mark as Read
              </Button>
            )}
            {onMarkReplied && (
              <Button variant="secondary" size="sm" onClick={onMarkReplied}>
                Mark as Replied
              </Button>
            )}
            {onArchive && (
              <Button variant="secondary" size="sm" onClick={onArchive}>
                Archive
              </Button>
            )}
            {onDelete && (
              <Button variant="danger" size="sm" onClick={onDelete}>
                Delete
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
