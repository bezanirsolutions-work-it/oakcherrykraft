import { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../../lib/supabase';
import { fetchAllLiveChatSessions, fetchLiveChatMessages, assignAgentToSession, closeLiveChatSession, sendAgentMessage } from '../../lib/liveChat';
import { useAuth } from '../../lib/AuthContext';
import { LiveChatConversationList } from '../../components/admin/LiveChatConversationList';
import { LiveChatMessages } from '../../components/admin/LiveChatMessages';
import { LiveChatDetails } from '../../components/admin/LiveChatDetails';

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
}

export default function LiveChatAdminPage() {
  const { isAdmin } = useAuth();
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
              const next = [...cur, { id: msg.id, author: msg.author, content: msg.content, created_at: msg.created_at }];
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
    try {
      const msgs = await fetchLiveChatMessages(session.id);
      setMessages(msgs ?? []);
      messagesRef.current = msgs ?? [];
      // mark unread count cleared locally when opening
      setSessions((cur) => cur.map((s) => (s.id === session.id ? { ...s, unread_count: 0 } : s)));
    } catch (err) {
      console.error(err);
    } finally {
      setMessagesLoading(false);
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

  return (
    <>
      <Helmet>
        <title>Live Chat | Oak Cherry Kraft Admin</title>
      </Helmet>

      <div className="flex flex-col gap-6">
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
                sending={sending}
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
              sending={sending}
            />
            
          </div>

          {/* Right: Details Panel (Desktop Only) */}
          <div className="hidden lg:col-span-3 lg:flex lg:rounded-[1.75rem] lg:border lg:border-bark/10 lg:bg-white lg:overflow-hidden">
            <LiveChatDetails
              session={selected}
              onAccept={handleAccept}
              onClose={handleClose}
              accepting={accepting}
              closing={closing}
            />
          </div>
        </div>
      </div>
    </>
  );
}

