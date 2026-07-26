import { type ContactMessage } from '../../hooks/useContactMessages';
import { ContactMessageRow } from './ContactMessageRow';

interface ContactMessagesTableProps {
  messages: ContactMessage[];
  onView: (message: ContactMessage) => void;
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function ContactMessagesTable({
  messages,
  onView,
  onMarkRead,
  onArchive,
  onDelete,
  isLoading = false,
}: ContactMessagesTableProps) {
  return (
    <div className="overflow-x-auto rounded-[1.5rem] border border-bark/10 bg-white shadow-soft">
      <table className="min-w-full divide-y divide-bark/10 text-left text-sm">
        <thead className="bg-sand">
          <tr>
            <th className="px-4 py-4 font-semibold text-bark/80">Status</th>
            <th className="px-4 py-4 font-semibold text-bark/80">Name</th>
            <th className="hidden px-4 py-4 font-semibold text-bark/80 sm:table-cell">Email</th>
            <th className="hidden px-4 py-4 font-semibold text-bark/80 lg:table-cell">Phone</th>
            <th className="px-4 py-4 font-semibold text-bark/80">Subject</th>
            <th className="hidden px-4 py-4 font-semibold text-bark/80 md:table-cell">Preview</th>
            <th className="px-4 py-4 font-semibold text-bark/80">Date</th>
            <th className="px-4 py-4 text-right font-semibold text-bark/80">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-bark/10 bg-white">
          {messages.map((message) => (
            <ContactMessageRow
              key={message.id}
              message={message}
              onView={onView}
              onMarkRead={onMarkRead}
              onArchive={onArchive}
              onDelete={onDelete}
              isLoading={isLoading}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
