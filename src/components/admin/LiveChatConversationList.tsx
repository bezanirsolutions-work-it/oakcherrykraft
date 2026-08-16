import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

interface Session {
  id: string;
  visitor_name: string | null;
  last_activity_at: string | null;
  status: string;
  unread_count?: number;
  visitor_email?: string | null;
  visitor_phone?: string | null;
  created_at?: string | null;
  assigned_agent_id?: string | null;
}

interface ConversationListProps {
  sessions: any[];
  selected: any | null;
  onSelect: (session: any) => void;
  filter: 'pending' | 'active' | 'closed' | 'all';
  onFilterChange: (filter: 'pending' | 'active' | 'closed' | 'all') => void;
  loading: boolean;
  connectionState?: 'connected' | 'reconnecting' | 'disconnected';
  onDeleteAllClosed?: () => void;
  deleteAllLoading?: boolean;
}

function formatTime(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-700';
    case 'active':
      return 'bg-green-100 text-green-700';
    case 'closed':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

export function LiveChatConversationList({
  sessions,
  selected,
  onSelect,
  filter,
  onFilterChange,
  loading,
  connectionState = 'connected',
  onDeleteAllClosed,
  deleteAllLoading = false,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) =>
      (s.visitor_name ?? 'Guest').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sessions, searchQuery]);

  return (
    <div className="flex w-full h-full flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="border-b border-bark/10 px-4 py-4 flex-shrink-0 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-bark">Live Chat</h2>
        <div className="text-xs flex items-center gap-2 text-bark/60">
          <span
            aria-hidden
            className={`inline-block h-2 w-2 rounded-full ${
              connectionState === 'connected' ? 'bg-emerald-400' : connectionState === 'reconnecting' ? 'bg-yellow-400' : 'bg-gray-300'
            }`}
          />
          <span>{connectionState === 'connected' ? 'Connected' : connectionState === 'reconnecting' ? 'Reconnecting' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Search */}
      <div className="border-b border-bark/10 px-4 py-3 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bark/40" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-bark/10 bg-sand/30 text-sm text-bark placeholder-bark/40 outline-none transition focus:border-oak-600 focus:ring-2 focus:ring-oak-200"
          />
        </div>
      </div>

      {/* Filter */}
      <div className="border-b border-bark/10 px-4 py-3 flex-shrink-0">
        <div className="flex gap-2 mb-2">
          {(['pending', 'active', 'closed', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                filter === f
                  ? 'bg-oak-600 text-white'
                  : 'bg-sand/50 text-bark hover:bg-sand/75'
              }`}
            >
              {f === 'pending' ? 'Waiting' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {onDeleteAllClosed && (
          <button
            onClick={onDeleteAllClosed}
            disabled={deleteAllLoading}
            className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60 transition"
          >
            {deleteAllLoading ? 'Deleting...' : 'Delete All Closed'}
          </button>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto min-w-0">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-sm text-bark/60">Loading...</div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
            <div className="text-sm text-bark/60">
              {searchQuery ? 'No matching conversations' : 'No conversations yet'}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-bark/5">
            {filteredSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelect(session)}
                className={`w-full px-4 py-3 text-left transition hover:bg-sand/40 ${
                  selected?.id === session.id ? 'bg-sand/60' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-bark">
                        {session.visitor_name ?? 'Website Visitor'}
                      </h3>
                      {session.unread_count && session.unread_count > 0 ? (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white">
                          {session.unread_count > 99 ? '99+' : session.unread_count}
                        </span>
                      ) : null}
                    </div>
                    {session.visitor_phone && (
                      <p className="truncate text-xs text-bark/60 mt-1">
                        {session.visitor_phone}
                      </p>
                    )}
                    {!session.visitor_phone && (
                      <p className="truncate text-xs text-bark/60 mt-1">
                        {formatTime(session.last_activity_at)}
                      </p>
                    )}
                  </div>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium shrink-0 ${getStatusColor(session.status)}`}>
                    {session.status === 'pending' ? '●' : ''} {session.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
