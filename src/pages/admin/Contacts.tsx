import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Inbox, Mail, Phone, Search, Copy, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string | null;
  created_at: string;
}

type SortOption = 'newest' | 'oldest' | 'name-az' | 'name-za' | 'subject';

type ClipboardField = 'email' | 'phone' | 'message';

export function Contacts() {
  const [messages, setMessages] = useState<ContactMessageRow[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessageRow | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<ClipboardField | null>(null);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('contact_messages')
        .select('id, name, email, phone, subject, message, created_at')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        setMessages([]);
      } else {
        setMessages(data ?? []);
      }

      setLoading(false);
    };

    loadMessages();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOption]);

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));

  const messageSnippet = (message: string | null) => {
    if (!message) return 'No message provided';
    return message.length > 80 ? `${message.slice(0, 80).trim()}…` : message;
  };

  const copyToClipboard = async (value: string, field: ClipboardField) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 2000);
    } catch {
      setCopiedField(null);
    }
  };

  const filteredMessages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return messages.filter((message) => {
      if (!query) {
        return true;
      }

      return [message.name, message.email, message.phone ?? '', message.subject ?? '', message.message ?? '']
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [messages, searchQuery]);

  const sortedMessages = useMemo(() => {
    const sorted = [...filteredMessages];

    sorted.sort((a, b) => {
      switch (sortOption) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name-az':
          return a.name.localeCompare(b.name);
        case 'name-za':
          return b.name.localeCompare(a.name);
        case 'subject':
          return (a.subject ?? '').localeCompare(b.subject ?? '');
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return sorted;
  }, [filteredMessages, sortOption]);

  const totalFilteredMessages = sortedMessages.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredMessages / ITEMS_PER_PAGE));
  const currentPageSafe = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const paginatedMessages = useMemo(() => {
    const startIndex = (currentPageSafe - 1) * ITEMS_PER_PAGE;
    return sortedMessages.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedMessages, currentPageSafe]);

  const getContactBadgeClass = (subject: string | null) =>
    subject ? 'bg-sand text-bark' : 'bg-bark/5 text-bark/80';

  return (
    <section className="rounded-[2rem] border border-bark/10 bg-white p-6 shadow-soft">
      <div className="mb-6 space-y-4 lg:flex lg:items-end lg:justify-between lg:space-y-0">
        <div>
          <h2 className="text-2xl font-semibold text-bark">Contact Messages</h2>
          <p className="mt-2 text-sm leading-7 text-bark/70">
            Review incoming customer enquiries, contact details, and message history.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 sm:items-end sm:gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="contact-search" className="sr-only">
              Search contact messages
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-bark/40" />
              <input
                id="contact-search"
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name, email, subject, or message"
                className="w-full rounded-full border border-bark/10 bg-sand/80 px-12 py-3 text-sm text-bark outline-none transition placeholder:text-bark/40 focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
              />
            </div>
          </div>

          <div>
            <label htmlFor="sort-messages" className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-bark/60">
              Sort by
            </label>
            <select
              id="sort-messages"
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value as SortOption)}
              className="w-full rounded-full border border-bark/10 bg-white px-4 py-3 text-sm text-bark outline-none transition focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name-az">Name A–Z</option>
              <option value="name-za">Name Z–A</option>
              <option value="subject">Subject</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="animate-pulse rounded-[1.5rem] border border-bark/10 bg-sand p-6">
              <div className="h-4 w-3/4 rounded-full bg-bark/10" />
              <div className="mt-4 space-y-3">
                <div className="h-4 w-full rounded-full bg-bark/10" />
                <div className="h-4 w-5/6 rounded-full bg-bark/10" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-6 shadow-soft">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-700">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold text-red-800">Unable to load messages</p>
              <p className="mt-2 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="rounded-[1.5rem] border border-bark/10 bg-sand p-6 text-sm text-bark/70">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-oak-100 text-oak-700">
              <Inbox className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-bark">No contact messages yet</p>
              <p className="mt-2 text-sm text-bark/70">Messages will appear here after visitors send an enquiry.</p>
            </div>
          </div>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="rounded-[1.5rem] border border-bark/10 bg-sand p-6 text-sm text-bark/70">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-oak-100 text-oak-700">
              <Inbox className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-bark">No messages match your search.</p>
              <p className="mt-2 text-sm text-bark/70">Try adjusting the search terms or sorting options.</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-[1.5rem] border border-bark/10 bg-white">
            <table className="min-w-full divide-y divide-bark/10 text-left text-sm">
              <thead className="bg-sand">
                <tr>
                  <th className="px-4 py-4 font-semibold text-bark/80">Name</th>
                  <th className="px-4 py-4 font-semibold text-bark/80">Email</th>
                  <th className="px-4 py-4 font-semibold text-bark/80">Phone</th>
                  <th className="px-4 py-4 font-semibold text-bark/80">Subject</th>
                  <th className="px-4 py-4 font-semibold text-bark/80">Received</th>
                  <th className="px-4 py-4 font-semibold text-bark/80">Message</th>
                  <th className="px-4 py-4 font-semibold text-bark/80">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bark/10 bg-white">
                {paginatedMessages.map((message) => (
                  <tr key={message.id} className="hover:bg-sand/50">
                    <td className="whitespace-nowrap px-4 py-4 text-bark">{message.name}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-bark/70">{message.email}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-bark/70">{message.phone ?? '—'}</td>
                    <td className="px-4 py-4 text-bark/70">{message.subject ?? 'General'}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-bark/70">{formatDate(message.created_at)}</td>
                    <td className="px-4 py-4 text-bark/70">{messageSnippet(message.message)}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedMessage(message)}
                        className="rounded-full border border-bark/10 bg-sand/80 px-3 py-2 text-sm font-semibold text-bark transition hover:bg-bark/5"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <div className="mt-4 flex flex-col gap-4 rounded-[1.5rem] border border-bark/10 bg-sand p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-bark/70">
                Page {currentPageSafe} of {totalPages} · {totalFilteredMessages} message{totalFilteredMessages === 1 ? '' : 's'}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPageSafe === 1}
                  className="inline-flex items-center justify-center rounded-full border border-bark/10 bg-white px-4 py-2 text-sm font-semibold text-bark transition hover:bg-bark/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPageSafe === totalPages}
                  className="inline-flex items-center justify-center rounded-full border border-bark/10 bg-white px-4 py-2 text-sm font-semibold text-bark transition hover:bg-bark/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}

      {selectedMessage ? (
        <div className="mt-6 rounded-[1.5rem] border border-bark/10 bg-sand p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-bark">Message details</h3>
              <p className="mt-2 text-sm leading-6 text-bark/70">Review the full customer enquiry and contact actions.</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedMessage(null)}
              className="inline-flex h-11 items-center justify-center rounded-full border border-bark/10 bg-white px-4 py-2 text-sm font-semibold text-bark transition hover:bg-bark/5"
            >
              Close
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-bark/10 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Name</p>
              <p className="mt-2 text-base font-semibold text-bark">{selectedMessage.name}</p>
            </div>
            <div className="rounded-[1.5rem] border border-bark/10 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Email</p>
              <p className="mt-2 text-base font-semibold text-bark">{selectedMessage.email}</p>
            </div>
            <div className="rounded-[1.5rem] border border-bark/10 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Phone</p>
              <p className="mt-2 text-base font-semibold text-bark">{selectedMessage.phone ?? 'Not provided'}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-bark/10 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Subject</p>
              <p className="mt-2 text-base font-semibold text-bark">{selectedMessage.subject ?? 'General enquiry'}</p>
            </div>
            <div className="rounded-[1.5rem] border border-bark/10 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Received</p>
              <p className="mt-2 text-base font-semibold text-bark">{formatDate(selectedMessage.created_at)}</p>
            </div>
            <div className="rounded-[1.5rem] border border-bark/10 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Payload</p>
              <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getContactBadgeClass(selectedMessage.subject)}`}>
                {selectedMessage.subject ? 'Subject provided' : 'No subject'}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-[1.5rem] border border-bark/10 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Message</p>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-bark/75">{selectedMessage.message ?? 'No message content provided.'}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => copyToClipboard(selectedMessage.email, 'email')}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-bark/10 bg-white px-4 py-3 text-sm font-semibold text-bark transition hover:bg-bark/5"
              >
                <Mail size={16} aria-hidden="true" /> Copy email
              </button>
              <button
                type="button"
                onClick={() => selectedMessage.phone && copyToClipboard(selectedMessage.phone, 'phone')}
                disabled={!selectedMessage.phone}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-bark/10 bg-white px-4 py-3 text-sm font-semibold text-bark transition hover:bg-bark/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Phone size={16} aria-hidden="true" /> Copy phone
              </button>
              <button
                type="button"
                onClick={() => selectedMessage.message && copyToClipboard(selectedMessage.message, 'message')}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-bark/10 bg-white px-4 py-3 text-sm font-semibold text-bark transition hover:bg-bark/5"
              >
                <Copy size={16} aria-hidden="true" /> Copy text
              </button>
            </div>

            {copiedField ? (
              <p className="text-sm text-emerald-700">{copiedField === 'email' ? 'Email copied.' : copiedField === 'phone' ? 'Phone copied.' : 'Message copied.'}</p>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <a
                href={`mailto:${selectedMessage.email}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-bark/10 bg-white px-4 py-3 text-sm font-semibold text-bark transition hover:bg-bark/5"
              >
                <Mail size={16} aria-hidden="true" /> Send email
              </a>
              <a
                href={selectedMessage.phone ? `tel:${selectedMessage.phone.replace(/\s+/g, '')}` : '#'}
                className={`inline-flex items-center justify-center gap-2 rounded-full border border-bark/10 bg-white px-4 py-3 text-sm font-semibold text-bark transition hover:bg-bark/5 ${!selectedMessage.phone ? 'pointer-events-none opacity-50' : ''}`}
              >
                <Phone size={16} aria-hidden="true" /> Call number
              </a>
              <a
                href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(selectedMessage.subject ?? 'Re: Your enquiry')}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-bark/10 bg-white px-4 py-3 text-sm font-semibold text-bark transition hover:bg-bark/5"
              >
                <MessageCircle size={16} aria-hidden="true" /> Reply quickly
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
