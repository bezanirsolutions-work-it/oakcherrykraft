import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Search } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useContactMessages, type ContactMessage } from '../../hooks/useContactMessages';
import { ContactMessagesTable } from '../../components/admin/ContactMessagesTable';
import { ContactLoadingSkeleton } from '../../components/admin/ContactLoadingSkeleton';
import { ContactEmptyState } from '../../components/admin/ContactEmptyState';
import { ContactMessageDetail } from '../../components/admin/ContactMessageDetail';
import { ConfirmationDialog } from '../../components/admin/ConfirmationDialog';

type SortOption = 'newest' | 'oldest' | 'name-az' | 'name-za' | 'subject';

type ActionType = 'delete' | 'archive' | null;

interface PendingAction {
  type: ActionType;
  messageId: string;
  messageName: string;
}

export function Contacts() {
  const { messages, loading, error, fetchMessages, markAsRead, markAsReplied, deleteMessage, archiveMessage } =
    useContactMessages();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOption]);

  const filteredMessages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return messages.filter((message) => {
      if (!query) return true;

      return [
        message.name,
        message.email,
        message.phone ?? '',
        message.subject ?? '',
        message.message ?? '',
      ].some((value) => value.toLowerCase().includes(query));
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

  const handleMarkRead = async (id: string) => {
    try {
      setIsProcessing(true);
      await markAsRead(id);
      setSelectedMessage(null);
    } catch {
      // Error is handled in hook
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkReplied = async (id: string) => {
    try {
      setIsProcessing(true);
      await markAsReplied(id);
      setSelectedMessage(null);
    } catch {
      // Error is handled in hook
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchive = async (id: string) => {
    setPendingAction({ type: 'archive', messageId: id, messageName: messages.find((m) => m.id === id)?.name || '' });
  };

  const handleDelete = async (id: string) => {
    setPendingAction({ type: 'delete', messageId: id, messageName: messages.find((m) => m.id === id)?.name || '' });
  };

  const confirmAction = async () => {
    if (!pendingAction) return;

    try {
      setIsProcessing(true);

      if (pendingAction.type === 'delete') {
        await deleteMessage(pendingAction.messageId);
      } else if (pendingAction.type === 'archive') {
        await archiveMessage(pendingAction.messageId);
      }

      setSelectedMessage(null);
      setPendingAction(null);
    } catch {
      // Error is handled in hook
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact Messages | Oak Cherry Kraft Admin</title>
      </Helmet>

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

        {/* States */}
        {loading ? (
          <ContactLoadingSkeleton />
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
          <ContactEmptyState
            title="No contact messages yet"
            description="Messages will appear here after visitors send an enquiry."
          />
        ) : filteredMessages.length === 0 ? (
          <ContactEmptyState
            title="No messages match your search"
            description="Try adjusting the search terms or sorting options."
          />
        ) : (
          <>
            {/* Table */}
            <ContactMessagesTable
              messages={paginatedMessages}
              onView={setSelectedMessage}
              onMarkRead={handleMarkRead}
              onArchive={handleArchive}
              onDelete={handleDelete}
              isLoading={isProcessing}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex flex-col gap-4 rounded-[1.5rem] border border-bark/10 bg-sand p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-bark/70">
                  Page {currentPageSafe} of {totalPages} · {totalFilteredMessages} message
                  {totalFilteredMessages === 1 ? '' : 's'}
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
            )}
          </>
        )}

        {/* Message Detail Modal */}
        {selectedMessage && (
          <ContactMessageDetail
            message={selectedMessage}
            onClose={() => setSelectedMessage(null)}
            onMarkRead={() => handleMarkRead(selectedMessage.id)}
            onMarkReplied={() => handleMarkReplied(selectedMessage.id)}
            onArchive={() => handleArchive(selectedMessage.id)}
            onDelete={() => handleDelete(selectedMessage.id)}
          />
        )}

        {/* Confirmation Dialog */}
        {pendingAction && (
          <ConfirmationDialog
            title={pendingAction.type === 'delete' ? 'Delete message?' : 'Archive message?'}
            description={
              pendingAction.type === 'delete'
                ? `Are you sure you want to permanently delete this message from ${pendingAction.messageName}? This action cannot be undone.`
                : `Archive the message from ${pendingAction.messageName}? Archived messages can be restored later.`
            }
            confirmLabel={pendingAction.type === 'delete' ? 'Delete' : 'Archive'}
            variant={pendingAction.type === 'delete' ? 'danger' : 'warning'}
            isLoading={isProcessing}
            onConfirm={confirmAction}
            onCancel={() => setPendingAction(null)}
          />
        )}
      </section>
    </>
  );
}
