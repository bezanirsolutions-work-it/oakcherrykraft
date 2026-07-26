import { type ContactMessage } from '../../hooks/useContactMessages';

interface ContactStatusBadgeProps {
  status: ContactMessage['status'];
}

const statusConfig = {
  new: {
    label: 'New',
    className: 'bg-emerald-100 text-emerald-700',
  },
  read: {
    label: 'Read',
    className: 'bg-blue-100 text-blue-700',
  },
  replied: {
    label: 'Replied',
    className: 'bg-purple-100 text-purple-700',
  },
  closed: {
    label: 'Closed',
    className: 'bg-gray-100 text-gray-700',
  },
};

export function ContactStatusBadge({ status }: ContactStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}
