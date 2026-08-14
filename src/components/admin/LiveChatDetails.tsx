import { Button } from '../ui/Button';

interface Session {
  id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  status: string;
  created_at: string | null;
  last_activity_at: string | null;
  assigned_agent_id: string | null;
}

interface LiveChatDetailsProps {
  session: Session | null;
  onAccept: () => void;
  onClose: () => void;
  accepting: boolean;
  closing: boolean;
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function LiveChatDetails({
  session,
  onAccept,
  onClose,
  accepting,
  closing,
}: LiveChatDetailsProps) {
  if (!session) {
    return (
      <div className="flex w-full flex-col items-center justify-center px-6 py-8 text-center">
        <p className="text-sm text-bark/60">Select a conversation to view details</p>
      </div>
    );
  }

  const isActive = session.status === 'active';
  const isClosed = session.status === 'closed';

  return (
    <div className="flex w-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-bark/10 px-5 py-4">
        <h3 className="text-sm font-semibold text-bark">Details</h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-5">
          {/* Visitor Name */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-bark/60 mb-2">
              Visitor Name
            </p>
            <p className="text-sm text-bark">{session.visitor_name ?? 'Website Visitor'}</p>
          </div>

          {/* Email */}
          {session.visitor_email ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-bark/60 mb-2">
                Email
              </p>
              <p className="text-sm text-bark break-all">
                <a
                  href={`mailto:${session.visitor_email}`}
                  className="text-oak-600 hover:underline"
                >
                  {session.visitor_email}
                </a>
              </p>
            </div>
          ) : null}

          {/* Phone */}
          {session.visitor_phone ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-bark/60 mb-2">
                Phone
              </p>
              <p className="text-sm text-bark">
                <a
                  href={`tel:${session.visitor_phone}`}
                  className="text-oak-600 hover:underline"
                >
                  {session.visitor_phone}
                </a>
              </p>
            </div>
          ) : null}

          {/* Status */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-bark/60 mb-2">
              Status
            </p>
            <div className="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-sand text-bark">
              {session.status === 'pending' ? '⏳ Waiting' : null}
              {session.status === 'active' ? '✓ Active' : null}
              {session.status === 'closed' ? '✕ Closed' : null}
              {!['pending', 'active', 'closed'].includes(session.status)
                ? session.status
                : null}
            </div>
          </div>

          {/* Session Started */}
          {session.created_at ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-bark/60 mb-2">
                Started
              </p>
              <p className="text-sm text-bark">{formatDateTime(session.created_at)}</p>
            </div>
          ) : null}

          {/* Last Activity */}
          {session.last_activity_at ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-bark/60 mb-2">
                Last Activity
              </p>
              <p className="text-sm text-bark">{formatDateTime(session.last_activity_at)}</p>
            </div>
          ) : null}

          {/* Session ID */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-bark/60 mb-2">
              Session ID
            </p>
            <p className="truncate font-mono text-xs text-bark/70">{session.id}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-bark/10 px-5 py-4 space-y-2">
        {!isActive && !isClosed ? (
          <Button
            onClick={onAccept}
            disabled={accepting}
            variant="primary"
            className="w-full"
            size="sm"
          >
            {accepting ? 'Accepting...' : 'Accept Chat'}
          </Button>
        ) : null}

        {!isClosed ? (
          <Button
            onClick={onClose}
            disabled={closing}
            variant="secondary"
            className="w-full"
            size="sm"
          >
            {closing ? 'Closing...' : 'Close Chat'}
          </Button>
        ) : null}

        {isClosed ? (
          <div className="flex items-center justify-center rounded-lg bg-gray-100 py-2">
            <p className="text-xs font-medium text-gray-600">Conversation closed</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
