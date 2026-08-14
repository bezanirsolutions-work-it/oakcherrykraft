import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from '../../components/ui/StatCard';
import { AlertCircle, Inbox, MessageCircle, MessageSquare, ShoppingCart, LayoutGrid, ClipboardList, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getProfileName } from '../../lib/profile';
import { fetchAllLiveChatSessions } from '../../lib/liveChat';

interface Counts {
  quote_requests: number;
  configurator_selections: number;
  contact_messages: number;
  products: number;
  testimonials: number;
  pending_chats: number;
  active_chats: number;
}

interface QuoteRequestRow {
  id: string;
  full_name: string;
  project_type: string | null;
  created_at: string | null;
}

interface ContactMessageRow {
  id: string;
  name: string;
  subject: string | null;
  created_at: string | null;
}

const initialCounts: Counts = {
  quote_requests: 0,
  configurator_selections: 0,
  contact_messages: 0,
  products: 0,
  testimonials: 0,
  pending_chats: 0,
  active_chats: 0,
};

export function Dashboard() {
  const [counts, setCounts] = useState<Counts>(initialCounts);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequestRow[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [_displayName, setDisplayName] = useState<string>('Ade');
  const mountedRef = useRef(true);

  const fetchUserName = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    const fallbackName = sessionData?.session?.user?.user_metadata?.full_name;

    if (!userId) {
      if (fallbackName && mountedRef.current) {
        setDisplayName(fallbackName.toString().trim().split(' ')[0] || 'Ade');
      }
      return;
    }

    try {
      const profileName = await getProfileName(userId);
      if (!mountedRef.current) return;
      const resolvedName = profileName ?? fallbackName;
      if (resolvedName) {
        setDisplayName(resolvedName.toString().trim().split(' ')[0] || 'Ade');
      }
    } catch {
      if (!mountedRef.current) return;
      if (fallbackName) {
        setDisplayName(fallbackName.toString().trim().split(' ')[0] || 'Ade');
      }
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [quoteCount, configuratorCount, messageCount, productCount, testimonialCount, recentQuotes, recentMessages, pendingChats, activeChats] = await Promise.all([
        supabase.from('quote_requests').select('id', { count: 'exact', head: true }),
        supabase.from('configurator_selections').select('id', { count: 'exact', head: true }),
        supabase.from('contact_messages').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('testimonials').select('id', { count: 'exact', head: true }),
        supabase
          .from('quote_requests')
          .select('id, full_name, project_type, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('contact_messages')
          .select('id, name, subject, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        fetchAllLiveChatSessions('pending').catch(() => []),
        fetchAllLiveChatSessions('active').catch(() => []),
      ]);

      if (!mountedRef.current) return;

      const requestError = [quoteCount, configuratorCount, messageCount, productCount, testimonialCount, recentQuotes, recentMessages].find(
        (response) => response.error
      );

      if (requestError?.error) {
        setError(requestError.error.message);
      }

      setCounts({
        quote_requests: quoteCount.count ?? 0,
        configurator_selections: configuratorCount.count ?? 0,
        contact_messages: messageCount.count ?? 0,
        products: productCount.count ?? 0,
        testimonials: testimonialCount.count ?? 0,
        pending_chats: Array.isArray(pendingChats) ? pendingChats.length : 0,
        active_chats: Array.isArray(activeChats) ? activeChats.length : 0,
      });

      setQuoteRequests(recentQuotes.data ?? []);
      setContactMessages(recentMessages.data ?? []);
    } catch (err) {
      if (mountedRef.current) {
        setError((err as Error).message);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setLastUpdated(
          new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          }).format(new Date())
        );
      }
    }
  };

  useEffect(() => {
    fetchUserName();
    fetchDashboardData();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const formatDate = (value: string | null | undefined) => {
    if (!value) return '';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(value));
  };

  const getLastUpdatedText = () => {
    if (lastUpdated) return lastUpdated;
    if (loading) return 'Updating…';
    return 'Just now';
  };

  return (
    <>
      <section className="rounded-[2rem] border border-bark/10 bg-white p-8 shadow-soft">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-bark/60">Hi Ade👋</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-bark">Hi Ade👋</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-bark/70">
              Here&apos;s what&apos;s happening at Oak Cherry Kraft today.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-[1.5rem] border border-bark/10 bg-sand px-4 py-3 text-sm text-bark">
              <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Last updated</p>
              <p className="mt-2 font-semibold">{getLastUpdatedText()}</p>
            </div>
            <button
              type="button"
              onClick={fetchDashboardData}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-full border border-bark/10 bg-white px-4 py-2 text-sm font-semibold text-bark transition hover:bg-bark/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-4">
        <StatCard
          icon={<MessageCircle className="h-5 w-5" />}
          value={`${counts.pending_chats + counts.active_chats}`}
          label="Live chat sessions"
          description={`${counts.pending_chats} pending • ${counts.active_chats} active`}
          className={counts.pending_chats > 0 ? 'border-orange-200 bg-orange-50' : ''}
        />
        <StatCard
          icon={<ClipboardList className="h-5 w-5" />}
          value={counts.quote_requests.toString()}
          label="Quote requests"
          description="Incoming quote submissions from customers."
        />
        <StatCard
          icon={<LayoutGrid className="h-5 w-5" />}
          value={counts.configurator_selections.toString()}
          label="Configurator selections"
          description="Saved configurator design requests."
        />
        <StatCard
          icon={<MessageSquare className="h-5 w-5" />}
          value={counts.contact_messages.toString()}
          label="Contact messages"
          description="Messages received from the contact form."
        />
        <StatCard
          icon={<Star className="h-5 w-5" />}
          value={counts.testimonials.toString()}
          label="Testimonials"
          description="Published client stories and homepage feedback."
        />
        <StatCard
          icon={<ShoppingCart className="h-5 w-5" />}
          value={counts.products.toString()}
          label="Products"
          description="Published product items in the catalogue."
        />
      </div>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          to="/admin/live-chat"
          className={`rounded-[1.5rem] border p-6 text-left transition hover:-translate-y-1 hover:shadow-medium ${
            counts.pending_chats > 0 
              ? 'border-orange-200 bg-orange-50' 
              : 'border-bark/10 bg-white'
          }`}
        >
          <p className="text-sm uppercase tracking-[0.35em] text-bark/60">Live Chat</p>
          <p className="mt-4 text-lg font-semibold text-bark">Manage customer conversations in real-time.</p>
          <p className="mt-6 text-sm font-medium text-oak-500">Open →</p>
        </Link>
        <Link
          to="/admin/quotes"
          className="rounded-[1.5rem] border border-bark/10 bg-white p-6 text-left transition hover:-translate-y-1 hover:shadow-medium"
        >
          <p className="text-sm uppercase tracking-[0.35em] text-bark/60">Manage Quotes</p>
          <p className="mt-4 text-lg font-semibold text-bark">View and manage quote submissions.</p>
          <p className="mt-6 text-sm font-medium text-oak-500">Open →</p>
        </Link>
        <Link
          to="/admin/configurator"
          className="rounded-[1.5rem] border border-bark/10 bg-white p-6 text-left transition hover:-translate-y-1 hover:shadow-medium"
        >
          <p className="text-sm uppercase tracking-[0.35em] text-bark/60">Configurator Requests</p>
          <p className="mt-4 text-lg font-semibold text-bark">Review saved configurator request details.</p>
          <p className="mt-6 text-sm font-medium text-oak-500">Open →</p>
        </Link>
        <Link
          to="/admin/contacts"
          className="rounded-[1.5rem] border border-bark/10 bg-white p-6 text-left transition hover:-translate-y-1 hover:shadow-medium"
        >
          <p className="text-sm uppercase tracking-[0.35em] text-bark/60">Contact Messages</p>
          <p className="mt-4 text-lg font-semibold text-bark">Read recent customer messages.</p>
          <p className="mt-6 text-sm font-medium text-oak-500">Open →</p>
        </Link>
        <Link
          to="/admin/products"
          className="rounded-[1.5rem] border border-bark/10 bg-white p-6 text-left transition hover:-translate-y-1 hover:shadow-medium"
        >
          <p className="text-sm uppercase tracking-[0.35em] text-bark/60">Products</p>
          <p className="mt-4 text-lg font-semibold text-bark">Manage the product catalog.</p>
          <p className="mt-6 text-sm font-medium text-oak-500">Open →</p>
        </Link>
      </section>

      <section className="mt-10 rounded-[2rem] border border-bark/10 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-bark">Recent Activity</h2>
            <p className="mt-2 text-sm leading-7 text-bark/70">
              Latest quotes and contact messages from the last five submissions.
            </p>
          </div>
          <span className="rounded-[1.5rem] border border-bark/10 bg-sand px-4 py-3 text-sm text-bark">
            {quoteRequests.length + contactMessages.length} total items
          </span>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {[...Array(2)].map((_, index) => (
              <div key={index} className="animate-pulse rounded-[1.75rem] border border-bark/10 bg-sand p-5">
                <div className="h-5 w-3/4 rounded-full bg-bark/10" />
                <div className="mt-4 space-y-3">
                  <div className="h-4 w-full rounded-full bg-bark/10" />
                  <div className="h-4 w-5/6 rounded-full bg-bark/10" />
                  <div className="h-4 w-2/3 rounded-full bg-bark/10" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-8 rounded-[2rem] border border-red-200 bg-red-50 p-6 shadow-soft">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-semibold text-red-800">Unable to load recent activity</p>
                <p className="mt-2 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[1.75rem] border border-bark/10 bg-sand p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-bark/60">Latest quotes</p>
                  <p className="mt-2 text-lg font-semibold text-bark">{quoteRequests.length} items</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-bark/70">
                  Quotes
                </span>
              </div>

              {quoteRequests.length === 0 ? (
                <div className="rounded-[1.5rem] border border-bark/10 bg-white p-6 text-sm text-bark/70">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-oak-100 text-oak-700">
                      <Inbox className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-bark">No quotes yet</p>
                      <p className="mt-1 text-sm text-bark/70">You’ll see the latest quote requests here when a customer submits one.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {quoteRequests.map((request) => (
                    <div key={request.id} className="rounded-[1.5rem] border border-bark/10 bg-white p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-base font-semibold text-bark">{request.full_name}</p>
                          <p className="mt-1 text-sm text-bark/70">Type: {request.project_type ?? 'Not specified'}</p>
                        </div>
                        <p className="text-sm text-bark/60">{formatDate(request.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[1.75rem] border border-bark/10 bg-sand p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-bark/60">Latest messages</p>
                  <p className="mt-2 text-lg font-semibold text-bark">{contactMessages.length} items</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-bark/70">
                  Messages
                </span>
              </div>

              {contactMessages.length === 0 ? (
                <div className="rounded-[1.5rem] border border-bark/10 bg-white p-6 text-sm text-bark/70">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-oak-100 text-oak-700">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-bark">No messages yet</p>
                      <p className="mt-1 text-sm text-bark/70">Customer messages will appear here as soon as someone reaches out.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {contactMessages.map((message) => (
                    <div key={message.id} className="rounded-[1.5rem] border border-bark/10 bg-white p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-base font-semibold text-bark">{message.name}</p>
                          <p className="mt-1 text-sm text-bark/70">Type: {message.subject ?? 'Contact message'}</p>
                        </div>
                        <p className="text-sm text-bark/60">{formatDate(message.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {error && !loading ? null : null}
    </>
  );
}
