import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';
import { fetchAllLiveChatSessions, fetchLiveChatMessages, assignAgentToSession, closeLiveChatSession, sendAgentMessage } from '../../lib/liveChat';
import { useAuth } from '../../lib/AuthContext';

interface SessionRow {
  id: string;
  visitor_name: string | null;
  last_activity_at: string | null;
  status: string;
}

export default function LiveChatAdminPage() {
  const { isAdmin } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [filter, setFilter] = useState<'pending' | 'active' | 'closed' | 'all'>('pending');
  const [loading, setLoading] = useState(false);
  const [composer, setComposer] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    fetchList();
  }, [isAdmin, filter]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const data = await fetchAllLiveChatSessions(filter === 'all' ? undefined : (filter as any));
      setSessions(data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (session: any) => {
    setSelected(session);
    try {
      const msgs = await fetchLiveChatMessages(session.id);
      setMessages(msgs ?? []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAccept = async () => {
    if (!selected) return;
    try {
      // assign current admin
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const adminId = session?.user?.id;
      await assignAgentToSession(selected.id, adminId as string);
      await fetchList();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClose = async () => {
    if (!selected) return;
    try {
      await closeLiveChatSession(selected.id);
      await fetchList();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async () => {
    if (!selected || !composer.trim()) return;
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
    }
  };

  return (
    <>
      <Helmet>
        <title>Live Chat | Oak Cherry Kraft Admin</title>
      </Helmet>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Live Chats</h2>
              <div>
                <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="rounded-full border px-3 py-2">
                  <option value="pending">Waiting</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              {sessions.map((s) => (
                <button key={s.id} onClick={() => handleSelect(s)} className="w-full text-left rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{s.visitor_name ?? 'Website Visitor'}</div>
                      <div className="text-xs text-gray-500">{s.last_activity_at}</div>
                    </div>
                    <div className="text-xs font-semibold">{s.status}</div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-8">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Conversation</h2>
              <div className="flex gap-2">
                <Button onClick={handleAccept} variant="primary">Accept Chat</Button>
                <Button onClick={handleClose} variant="secondary">Close Chat</Button>
              </div>
            </div>

            {selected ? (
              <div>
                <div className="mb-4">
                  <div className="text-sm font-semibold">{selected.visitor_name ?? 'Website Visitor'}</div>
                  <div className="text-xs text-gray-500">Status: {selected.status}</div>
                </div>

                <div className="space-y-3 mb-4 h-64 overflow-y-auto">
                  {messages.map((m) => (
                    <div key={m.id} className={`p-3 rounded ${m.author === 'agent' ? 'bg-oak-100 text-oak-700' : 'bg-sand text-bark'}`}>
                      <div className="text-sm">{m.content}</div>
                      <div className="text-xs text-gray-500">{m.created_at}</div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input value={composer} onChange={(e) => setComposer(e.target.value)} className="flex-1 rounded-full border px-4 py-2" />
                  <Button onClick={handleSend} variant="primary">Send</Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Select a conversation to view details.</div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
