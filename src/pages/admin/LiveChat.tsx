import { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../../lib/supabase';
import { fetchAllLiveChatSessions, fetchLiveChatMessages, fetchLiveChatFeedback, assignAgentToSession, closeLiveChatSession, sendAgentMessage, deleteLiveChatSession, deleteAllClosedChatSessions } from '../../lib/liveChat';
import { useAuth } from '../../lib/AuthContext';
import { LiveChatConversationList } from '../../components/admin/LiveChatConversationList';
import { LiveChatMessages } from '../../components/admin/LiveChatMessages';
import { LiveChatDetails } from '../../components/admin/LiveChatDetails';
import { LiveChatFeedbackPanel } from '../../components/admin/LiveChatFeedbackPanel';
import { formatFileSize } from '../../lib/attachmentUtils';

interface SessionRow {
  id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  last_activity_at: string | null;
  status: string;
  created_at: string | null;
  assigned_agent_id: string | null;
  // optional fields populated by server queries
  unread_count?: number;
}

interface MessageRow {
  id: string;
  author: 'visitor' | 'assistant' | 'agent' | 'system';
  content: string;
  created_at: string | null;
  metadata?: {
    attachments?: Array<{
      name: string;
      type: string;
      size: number;
      path: string;
    }>;
  } | null;
}

export default function LiveChatAdminPage() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'conversations' | 'feedback'>('conversations');
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [selected, setSelected] = useState<SessionRow | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [connectionState, setConnectionState] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected');
  const [filter, setFilter] = useState<'pending' | 'active' | 'closed' | 'all'>('all');
  const [initialLoading, setInitialLoading] = useState(true);
  const initialLoadingRef = useRef(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [composer, setComposer] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [sending, setSending] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ rating: number; comment: string | null; created_at: string | null } | null>(null);
  
  const globalMessagesChannelRef = useRef<any | null>(null);
  const selectedRef = useRef<SessionRow | null>(null);
  const messagesRef = useRef<MessageRow[]>([]);
  const sessionsRef = useRef<SessionRow[]>([]);
  const pollTimerRef = useRef<number | null>(null);
  const filterRef = useRef(filter);
  const fetchRequestIdRef = useRef(0);
  const lastAppliedFetchIdRef = useRef(0);
  const sessionsChannelRef = useRef<any | null>(null);

  useEffect(() => {
    if (!isAdmin) return;

    // keep refs in sync
    selectedRef.current = selected;
    messagesRef.current = messages;
    sessionsRef.current = sessions;
  }, [isAdmin, selected, messages, sessions]);

  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  const matchesSelectedFilter = (sessionStatus: string) => {
    return filterRef.current === 'all' || sessionStatus === filterRef.current;
  };

  // When the filter changes, run a background reconciliation immediately
  useEffect(() => {
    if (!isAdmin) return;
    // don't trigger foreground loading; reconcile in background so UI stays visible
    void fetchList({ background: true });
  }, [filter, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    let mounted = true;

    // initial data
    fetchList();

    // ensure any previous subscriptions are cleaned up
    try {
      globalMessagesChannelRef.current?.unsubscribe();
    } catch {}
    try {
      sessionsChannelRef.current?.unsubscribe();
    } catch {}
    globalMessagesChannelRef.current = null;
    sessionsChannelRef.current = null;

    setConnectionState(navigator.onLine ? 'reconnecting' : 'disconnected');

    // Subscribe to live_chat_messages INSERTs
    const messagesChannel = supabase
      .channel('public:live_chat_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_chat_messages' }, async (payload) => {
        console.warn('[live-chat-admin] realtime message INSERT', { payload: !!payload });
        try {
          const msg = payload.new as MessageRow & { session_id?: string };
          if (!msg || !msg.id || !msg.session_id) return;

          // dedupe
          const already = messagesRef.current.some((m) => m.id === msg.id);
          if (already) return;

          // append to selected conversation if open
          if (selectedRef.current && msg.session_id === selectedRef.current.id) {
            setMessages((cur) => {
              if (cur.some((m) => m.id === msg.id)) return cur;
              const next = [...cur, {
                id: msg.id,
                author: msg.author,
                content: msg.content,
                created_at: msg.created_at,
                metadata: msg.metadata ?? null,
              }];
              messagesRef.current = next;
              return next;
            });
          }

          // update or fetch session and merge into list
          setSessions((cur) => {
            const idx = cur.findIndex((s) => s.id === msg.session_id);
            if (idx !== -1) {
              const updated = [...cur];
              const target = { ...updated[idx] } as any;
              target.last_activity_at = msg.created_at ?? new Date().toISOString();
              target.latest_message = msg.content;
              if (!selectedRef.current || selectedRef.current.id !== msg.session_id) {
                target.unread_count = (target.unread_count ?? 0) + 1;
              }
              updated.splice(idx, 1);
              const next = [target, ...updated];
              sessionsRef.current = next;
              return next;
            }

              // session not present in current list -> fetch and insert if it matches filter
              // capture session id so TypeScript can narrow inside async function
              const sessionId = msg.session_id;
              (async () => {
                if (!sessionId) return;
                try {
                  const { data: sess } = await supabase.from('live_chat_sessions').select('*').eq('id', sessionId).maybeSingle();
                  if (sess && matchesSelectedFilter(sess.status)) {
                    setSessions((prev) => {
                      const mergedMap = new Map<string, SessionRow>();
                      for (const s of prev) mergedMap.set(s.id, s);
                      mergedMap.set(sess.id, sess as SessionRow);
                      const arr = Array.from(mergedMap.values()).sort((a, b) => (b.last_activity_at ?? '').localeCompare(a.last_activity_at ?? ''));
                      sessionsRef.current = arr;
                      return arr;
                    });
                  }
                } catch (e) {
                  console.warn('[live-chat-admin] fetch session on message insert failed', e);
                }
              })();

            return cur;
          });
        } catch (err) {
          console.error('[live-chat-admin] Error handling message insert', err);
        }
      })
      .subscribe();

    console.warn('[live-chat-admin] messages channel subscribed', { messagesChannel });
    globalMessagesChannelRef.current = messagesChannel;

    // Subscribe to live_chat_sessions INSERT and UPDATE
    const sessionsChannel = supabase
      .channel('public:live_chat_sessions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_chat_sessions' }, (payload) => {
        console.warn('[live-chat-admin] realtime session INSERT', payload?.new?.id);
        const s = payload.new as SessionRow;
        if (!matchesSelectedFilter(s.status)) return;
        setSessions((cur) => {
          const map = new Map(cur.map((i) => [i.id, i]));
          map.set(s.id, s);
          const arr = Array.from(map.values()).sort((a, b) => (b.last_activity_at ?? '').localeCompare(a.last_activity_at ?? ''));
          sessionsRef.current = arr;
          return arr;
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_chat_sessions' }, (payload) => {
        console.warn('[live-chat-admin] realtime session UPDATE', payload?.new?.id);
        const s = payload.new as SessionRow;
        setSessions((cur) => {
          const idx = cur.findIndex((it) => it.id === s.id);
          if (idx === -1) {
            if (matchesSelectedFilter(s.status)) {
              const next = [s, ...cur];
              sessionsRef.current = next;
              return next;
            }
            return cur;
          }

          const updated = [...cur];
          updated[idx] = { ...updated[idx], ...s };

          if (!matchesSelectedFilter(updated[idx].status)) {
            updated.splice(idx, 1);
          }

          sessionsRef.current = updated;
          if (selectedRef.current && selectedRef.current.id === s.id) {
            setSelected((sel) => (sel ? { ...sel, ...s } : sel));
            selectedRef.current = { ...selectedRef.current, ...s } as SessionRow;
          }
          return updated;
        });
      })
      .subscribe();

    sessionsChannelRef.current = sessionsChannel;

    // set connected once subscription created
    setConnectionState('connected');

    // simple reconnection safety: when the browser goes online, refetch lists/messages to catch missed items
    const handleOnline = () => {
      setConnectionState('reconnecting');
      fetchList();
      if (selectedRef.current) {
        fetchLiveChatMessages(selectedRef.current.id)
          .then((msgs) => {
            if (!mounted) return;
            // merge dedup
            setMessages((cur) => {
              const existingIds = new Set(cur.map((m) => m.id));
              const merged = [...cur];
              for (const m of msgs ?? []) {
                if (!existingIds.has(m.id)) merged.push(m as MessageRow);
              }
              messagesRef.current = merged;
              return merged;
            });
          })
          .catch(() => {});
      }
      setTimeout(() => setConnectionState('connected'), 1200);
    };

    const handleOffline = () => {
      setConnectionState('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      mounted = false;
      try {
        globalMessagesChannelRef.current?.unsubscribe();
      } catch {}
      globalMessagesChannelRef.current = null;
      try {
        sessionsChannelRef.current?.unsubscribe();
      } catch {}
      sessionsChannelRef.current = null;
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // only run once when admin mounts
  }, [isAdmin]);

  // polling fallback: periodically refresh sessions and selected messages
  useEffect(() => {
    if (!isAdmin) return;
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    const poll = async () => {
      try {
        await fetchList({ background: true });

        if (selectedRef.current) {
          const msgs = await fetchLiveChatMessages(selectedRef.current.id);
          setMessages((cur) => {
            const existingIds = new Set(cur.map((m) => m.id));
            const merged = [...cur];
            for (const m of msgs ?? []) {
              if (!existingIds.has(m.id)) merged.push(m as MessageRow);
            }
            messagesRef.current = merged;
            return merged;
          });
        }
      } catch (err) {
        console.warn('[live-chat-admin] poll error', err);
      }
    };

    pollTimerRef.current = window.setInterval(poll, 2000);
    void poll();

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [isAdmin]);

  

  const fetchList = async (options: { background?: boolean } = {}) => {
    const { background = false } = options;
    const requestId = ++fetchRequestIdRef.current;
    const isInitial = initialLoadingRef.current;
    try {
      const status = filterRef.current === 'all' ? undefined : (filterRef.current as any);
      const data = await fetchAllLiveChatSessions(status);

      if (background) {
        setSessions((cur) => {
          const map = new Map<string, SessionRow>();
          for (const s of cur) map.set(s.id, s);
          for (const s of (data ?? []) as SessionRow[]) map.set(s.id, s);
          const merged = Array.from(map.values()).filter((s) => !status || s.status === status);
          merged.sort((a, b) => (b.last_activity_at ?? '').localeCompare(a.last_activity_at ?? ''));
          sessionsRef.current = merged;
          return merged;
        });
      } else {
        // foreground fetch — apply results, but only show initial loading for the very first load
        lastAppliedFetchIdRef.current = requestId;
        setSessions(data ?? []);
        sessionsRef.current = data ?? [];
        if (isInitial) {
          setInitialLoading(false);
          initialLoadingRef.current = false;
        }
      }
    } catch (err) {
      console.error('[live-chat-admin] fetchList error', err);
    }
  };

  const handleSelect = async (session: SessionRow) => {
    setSelected(session);
    selectedRef.current = session;
    setComposer('');
    setMessagesLoading(true);
    setFeedback(null);
    try {
      const [msgs, sessionFeedback] = await Promise.all([
        fetchLiveChatMessages(session.id),
        fetchLiveChatFeedback(session.id),
      ]);
      setMessages(msgs ?? []);
      messagesRef.current = msgs ?? [];
      setFeedback(sessionFeedback ? { rating: sessionFeedback.rating, comment: sessionFeedback.comment, created_at: sessionFeedback.created_at } : null);
      // mark unread count cleared locally when opening
      setSessions((cur) => cur.map((s) => (s.id === session.id ? { ...s, unread_count: 0 } : s)));
    } catch (err) {
      console.error(err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const refreshSelectedFeedback = async (sessionId: string) => {
    try {
      const sessionFeedback = await fetchLiveChatFeedback(sessionId);
      setFeedback(sessionFeedback ? { rating: sessionFeedback.rating, comment: sessionFeedback.comment, created_at: sessionFeedback.created_at } : null);
    } catch (err) {
      console.error('[live-chat-admin] feedback refresh failed', err);
    }
  };

  const handleAccept = async () => {
    if (!selected) return;
    setAccepting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const adminId = session?.user?.id;
      await assignAgentToSession(selected.id, adminId as string);
      await fetchList();
      setSelected({ ...selected, status: 'active' });
    } catch (err) {
      console.error(err);
    } finally {
      setAccepting(false);
    }
  };

  const handleClose = async () => {
    if (!selected) return;
    setClosing(true);
    try {
      await closeLiveChatSession(selected.id);
      await fetchList();
      setSelected({ ...selected, status: 'closed' });
      await refreshSelectedFeedback(selected.id);
    } catch (err) {
      console.error(err);
    } finally {
      setClosing(false);
    }
  };

  const handleSend = async () => {
    if (!selected || !composer.trim()) return;
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const adminId = session?.user?.id as string;
      const adminName = (session?.user as any)?.user_metadata?.full_name ?? 'Agent';
      await sendAgentMessage(selected.id, adminId, adminName, composer.trim());
      setComposer('');
      const msgs = await fetchLiveChatMessages(selected.id);
      setMessages(msgs ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const formatTranscriptDate = (dateString: string | null): string => {
    if (!dateString) return 'Not provided';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Not provided';
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const sanitizeFilename = (value: string) => value
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'conversation';

  const getSenderLabel = (author: string) => {
    switch (author) {
      case 'visitor':
        return 'Visitor';
      case 'agent':
      case 'assistant':
        return 'Oak Cherry Kraft';
      case 'system':
        return 'System';
      default:
        return 'Visitor';
    }
  };

  const exportConversation = async () => {
    if (!selected) {
      alert('There are no messages to export.');
      return;
    }

    setExporting(true);

    try {
      const fullHistory = await fetchLiveChatMessages(selected.id);
      if (!fullHistory || fullHistory.length === 0) {
        alert('There are no messages to export.');
        return;
      }

      const orderedMessages = [...fullHistory].sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return aTime - bTime;
      });

      const sessionStarted = selected.created_at ? formatTranscriptDate(selected.created_at) : 'Not provided';
      const exportedAt = formatTranscriptDate(new Date().toISOString());
      const shortId = sanitizeFilename(selected.id.slice(0, 8));
      const dateStamp = new Date().toISOString().slice(0, 10);
      const filename = `oak-cherry-kraft-chat-${dateStamp}-${shortId}.txt`;

      const feedbackLine = feedback && feedback.rating
        ? `Visitor feedback: ${'★'.repeat(feedback.rating)}${'☆'.repeat(5 - feedback.rating)} (${feedback.rating}/5)`
        : 'Visitor feedback: Not provided';

      const lines: string[] = [
        '# Oak Cherry Kraft - Live Chat Conversation',
        `Visitor: ${selected.visitor_name || 'Not provided'}`,
        `Email: ${selected.visitor_email || 'Not provided'}`,
        `Phone: ${selected.visitor_phone || 'Not provided'}`,
        `Session ID: ${selected.id || 'Not provided'}`,
        `Conversation Started: ${sessionStarted}`,
        `Conversation Exported: ${exportedAt}`,
        feedbackLine,
        feedback?.comment ? `Feedback comment: ${feedback.comment}` : 'Feedback comment: Not provided',
        '',
        '---',
      ];

      for (const msg of orderedMessages) {
        const timestamp = formatTranscriptDate(msg.created_at);
        const cleanContent = (msg.content ?? '').replace(/\r\n/g, '\n').trim();
        lines.push(``);
        lines.push(`[${timestamp}] ${getSenderLabel(msg.author)}`);
        if (cleanContent) {
          lines.push(cleanContent);
        }

        const attachments = Array.isArray(msg.metadata?.attachments) ? msg.metadata.attachments : [];
        if (attachments.length) {
          for (const attachment of attachments) {
            lines.push('');
            lines.push(`[Attachment: ${attachment.name || 'Unknown attachment'}]`);
            if (attachment.type) lines.push(`Type: ${attachment.type}`);
            if (typeof attachment.size === 'number') lines.push(`Size: ${formatFileSize(attachment.size)}`);
          }
        }
      }

      lines.push('');
      lines.push('---');
      lines.push('End of conversation');

      const transcript = `${lines.join('\n')}\n`;
      const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('[live-chat-admin] export failed', error);
      alert('Unable to export this conversation. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    const confirmDelete = window.confirm('Delete this closed chat permanently? This will remove the chat session and its messages and cannot be undone.');
    if (!confirmDelete) return;
    
    setDeleting(true);
    try {
      await deleteLiveChatSession(selected.id);
      await fetchList();
      setSelected(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete chat session');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAllClosed = async () => {
    try {
      const closedCount = sessions.filter(s => s.status === 'closed').length;
      if (closedCount === 0) {
        alert('No closed chats to delete');
        return;
      }
      
      const confirmDelete = window.confirm(`Delete all ${closedCount} closed chat(s) permanently? This cannot be undone.`);
      if (!confirmDelete) return;
      
      setDeleteAllLoading(true);
      await deleteAllClosedChatSessions();
      await fetchList();
      if (selected?.status === 'closed') {
        setSelected(null);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete closed chat sessions');
    } finally {
      setDeleteAllLoading(false);
    }
  };

  const handleViewConversationFromFeedback = async (sessionId: string) => {
    try {
      // Find the session by ID, or fetch it if not in current list
      let session = sessions.find(s => s.id === sessionId);
      
      if (!session) {
        // Try to fetch the session directly from Supabase
        const { data } = await supabase
          .from('live_chat_sessions')
          .select('*')
          .eq('id', sessionId)
          .maybeSingle();
        
        if (data) {
          session = data as SessionRow;
        }
      }

      if (session) {
        setActiveTab('conversations');
        await handleSelect(session);
      }
    } catch (err) {
      console.error('Failed to view conversation:', err);
      alert('Failed to load conversation');
    }
  };

  return (
    <>
      <Helmet>
        <title>Live Chat | Oak Cherry Kraft Admin</title>
      </Helmet>

      <div className="flex flex-col gap-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-bark/10">
          <button
            onClick={() => setActiveTab('conversations')}
            className={`px-4 py-3 font-medium text-sm transition border-b-2 ${
              activeTab === 'conversations'
                ? 'border-oak-600 text-oak-600'
                : 'border-transparent text-bark/60 hover:text-bark'
            }`}
          >
            Conversations
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-3 font-medium text-sm transition border-b-2 ${
              activeTab === 'feedback'
                ? 'border-oak-600 text-oak-600'
                : 'border-transparent text-bark/60 hover:text-bark'
            }`}
          >
            Feedback
          </button>
        </div>

        {/* Conversations Tab */}
        {activeTab === 'conversations' && (
          <>
        {/* Mobile: Conversation List Only (Default View) */}
        <div className="md:hidden">
          <div className="rounded-[1.75rem] border border-bark/10 bg-white overflow-hidden">
            <LiveChatConversationList
              sessions={sessions}
              selected={selected}
              onSelect={handleSelect}
              filter={filter}
              onFilterChange={setFilter}
              loading={initialLoading}
              connectionState={connectionState}
              onDeleteAllClosed={handleDeleteAllClosed}
              deleteAllLoading={deleteAllLoading}
            />
          </div>
        </div>

        {/* Mobile: Selected Conversation (When selected) */}
        {selected && (
          <div className="md:hidden">
            <div className="rounded-[1.75rem] border border-bark/10 bg-white overflow-hidden flex flex-col h-96">
              <LiveChatMessages
                session={selected}
                messages={messages}
                composer={composer}
                onComposerChange={setComposer}
                onSend={handleSend}
                onExport={exportConversation}
                sending={sending}
                exporting={exporting}
                feedback={feedback}
              />
            </div>
            <div className="mt-4 flex gap-3">
              {selected.status !== 'active' && selected.status !== 'closed' ? (
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="flex-1 rounded-full bg-oak-600 text-white px-4 py-3 font-medium text-sm transition hover:bg-oak-700 disabled:opacity-60"
                >
                  {accepting ? 'Accepting...' : 'Accept Chat'}
                </button>
              ) : null}
              {selected.status !== 'closed' ? (
                <button
                  onClick={handleClose}
                  disabled={closing}
                  className="flex-1 rounded-full border border-bark/10 bg-white text-bark px-4 py-3 font-medium text-sm transition hover:bg-sand disabled:opacity-60"
                >
                  {closing ? 'Closing...' : 'Close Chat'}
                </button>
              ) : null}
            </div>
          </div>
        )}

        {/* Tablet + Desktop: Three-Column Layout */}
        <div className="hidden md:grid md:grid-cols-12 md:gap-6 md:h-[600px]">
          {/* Left: Conversation List */}
          <div className="md:col-span-4 lg:col-span-3 rounded-[1.75rem] border border-bark/10 bg-white overflow-hidden flex flex-col">
            <LiveChatConversationList
              sessions={sessions}
              selected={selected}
              onSelect={handleSelect}
              filter={filter}
              onFilterChange={setFilter}
              loading={initialLoading}
              connectionState={connectionState}
              onDeleteAllClosed={handleDeleteAllClosed}
              deleteAllLoading={deleteAllLoading}
            />
          </div>

          {/* Center: Chat Messages */}
          <div className="md:col-span-8 lg:col-span-6 rounded-[1.75rem] border border-bark/10 bg-white overflow-hidden flex flex-col">
            <LiveChatMessages
              session={selected}
              messages={messages}
              composer={composer}
              onComposerChange={setComposer}
              onSend={handleSend}
              onExport={exportConversation}
              sending={sending}
              exporting={exporting}
              feedback={feedback}
            />
            
          </div>

          {/* Right: Details Panel (Desktop Only) */}
          <div className="hidden lg:col-span-3 lg:flex lg:rounded-[1.75rem] lg:border lg:border-bark/10 lg:bg-white lg:overflow-hidden">
            <LiveChatDetails
              session={selected}
              onAccept={handleAccept}
              onClose={handleClose}
              onDelete={handleDelete}
              accepting={accepting}
              closing={closing}
              deleting={deleting}
            />
          </div>
        </div>
        </>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="hidden md:block rounded-[1.75rem] border border-bark/10 bg-white overflow-hidden md:h-[600px]">
            <LiveChatFeedbackPanel
              onSelectSession={handleViewConversationFromFeedback}
              loading={initialLoading}
            />
          </div>
        )}

        {/* Mobile Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="md:hidden rounded-[1.75rem] border border-bark/10 bg-white overflow-hidden h-[600px]">
            <LiveChatFeedbackPanel
              onSelectSession={handleViewConversationFromFeedback}
              loading={initialLoading}
            />
          </div>
        )}
      </div>
    </>
  );
}

