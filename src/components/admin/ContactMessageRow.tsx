import { Archive, Eye, MessageSquare, Trash2 } from 'lucide-react';
import { type ContactMessage } from '../../hooks/useContactMessages';
import { ContactStatusBadge } from './ContactStatusBadge';

interface ContactMessageRowProps {
  message: ContactMessage;
  onView: (message: ContactMessage) => void;
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function ContactMessageRow({
  message,
  onView,
  onMarkRead,
  onArchive,
  onDelete,
  isLoading = false,
}: ContactMessageRowProps) {
  const messagePreview = message.message
    ? message.message.length > 60
      ? `${message.message.slice(0, 60)}…`
      : message.message
    : 'No message provided';

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));

  return (
    <tr className="border-b border-bark/10 hover:bg-sand/30">
      <td className="whitespace-nowrap px-4 py-4">
        <ContactStatusBadge status={message.status} />
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-bark">{message.name}</td>
      <td className="hidden px-4 py-4 text-sm text-bark/70 sm:table-cell">{message.email}</td>
      <td className="hidden px-4 py-4 text-sm text-bark/70 lg:table-cell">{message.phone || '—'}</td>
      <td className="px-4 py-4 text-sm text-bark/70">{message.subject || 'General'}</td>
      <td className="hidden px-4 py-4 text-sm text-bark/70 md:table-cell">{messagePreview}</td>
      <td className="whitespace-nowrap px-4 py-4 text-xs text-bark/70">{formatDate(message.created_at)}</td>
      <td className="whitespace-nowrap px-4 py-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onView(message)}
            disabled={isLoading}
            title="View message"
            className="rounded-lg border border-bark/10 bg-white p-2 text-bark transition hover:bg-sand disabled:opacity-50"
          >
            <Eye className="h-4 w-4" />
          </button>
          {message.status === 'new' && (
            <button
              type="button"
              onClick={() => onMarkRead(message.id)}
              disabled={isLoading}
              title="Mark as read"
              className="rounded-lg border border-bark/10 bg-white p-2 text-bark transition hover:bg-sand disabled:opacity-50"
            >
              <MessageSquare className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onArchive(message.id)}
            disabled={isLoading}
            title="Archive message"
            className="rounded-lg border border-bark/10 bg-white p-2 text-bark transition hover:bg-sand disabled:opacity-50"
          >
            <Archive className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(message.id)}
            disabled={isLoading}
            title="Delete message"
            className="rounded-lg border border-bark/10 bg-white p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
