import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Inbox, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface QuoteRequestRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  project_type: string | null;
  configuration: Record<string, unknown> | null;
  status: string;
  created_at: string;
}

interface ConfiguratorSelectionRow {
  material: string | null;
  finish: string | null;
  colour: string | null;
  accessories: Record<string, unknown> | null;
  estimated_price: number | null;
}

const statusOptions = ['pending', 'reviewing', 'quoted', 'accepted', 'rejected'] as const;

type StatusOption = (typeof statusOptions)[number];

interface QuoteDetailsRow extends QuoteRequestRow {
  room_type: string | null;
  dimensions: string | null;
  budget: string | null;
  notes: string | null;
  status: string;
  updated_at?: string | null;
  configurator_selections: ConfiguratorSelectionRow[];
}

type ClipboardField = 'email' | 'phone' | 'quoteId';

export function Quotes() {
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequestRow[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<QuoteDetailsRow | null>(null);
  const [selectedQuoteLoading, setSelectedQuoteLoading] = useState(false);
  const [rowStatusSaving, setRowStatusSaving] = useState<Record<string, boolean>>({});
  const [rowStatusErrors, setRowStatusErrors] = useState<Record<string, string | null>>({});
  const [copiedField, setCopiedField] = useState<ClipboardField | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StatusOption>('all');
  const [projectTypeFilter, setProjectTypeFilter] = useState('all');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'customer-az' | 'customer-za' | 'status'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuotes = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('quote_requests')
        .select('id, full_name, email, phone, project_type, configuration, status, created_at')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        setQuoteRequests([]);
      } else {
        setQuoteRequests(data ?? []);
      }

      setLoading(false);
    };

    loadQuotes();
  }, []);

  const loadQuoteDetails = async (quoteId: string) => {
    setSelectedQuote(null);
    setSelectedQuoteLoading(true);
    setError(null);

    const { data, error: detailError } = await supabase
      .from('quote_requests')
      .select(
        `id, full_name, email, phone, project_type, room_type, dimensions, budget, configuration, notes, status, created_at, configurator_selections(material, finish, colour, accessories, estimated_price)`
      )
      .eq('id', quoteId)
      .single();

    if (detailError) {
      setError(detailError.message);
    } else {
      const details = data as QuoteDetailsRow;
      setSelectedQuote(details);
    }

    setSelectedQuoteLoading(false);
  };

  const updateQuoteStatus = async (quoteId: string, newStatus: StatusOption) => {
    const previousStatus = quoteRequests.find((request) => request.id === quoteId)?.status ?? 'pending';

    setQuoteRequests((current) =>
      current.map((request) =>
        request.id === quoteId ? { ...request, status: newStatus } : request
      )
    );

    if (selectedQuote?.id === quoteId) {
      setSelectedQuote({ ...selectedQuote, status: newStatus });
    }

    setRowStatusSaving((prev) => ({ ...prev, [quoteId]: true }));
    setRowStatusErrors((prev) => ({ ...prev, [quoteId]: null }));

    const { error: updateError } = await supabase
      .from('quote_requests')
      .update({ status: newStatus })
      .eq('id', quoteId);

    if (updateError) {
      setQuoteRequests((current) =>
        current.map((request) =>
          request.id === quoteId ? { ...request, status: previousStatus } : request
        )
      );

      if (selectedQuote?.id === quoteId) {
        setSelectedQuote({ ...selectedQuote, status: previousStatus });
      }

      setRowStatusErrors((prev) => ({
        ...prev,
        [quoteId]: `Unable to save status: ${updateError.message}`,
      }));
      setRowStatusSaving((prev) => ({ ...prev, [quoteId]: false }));
      return;
    }

    setRowStatusSaving((prev) => ({ ...prev, [quoteId]: false }));
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

  const projectTypes = useMemo(
    () => Array.from(new Set(quoteRequests.map((request) => request.project_type ?? 'Not specified'))).sort(),
    [quoteRequests]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, projectTypeFilter]);

  const formatValue = (value: string | null | undefined) => value && value.trim() ? value : 'Not provided';

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'reviewing':
        return 'bg-amber-100 text-amber-700';
      case 'quoted':
        return 'bg-blue-100 text-blue-700';
      case 'accepted':
        return 'bg-emerald-100 text-emerald-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-sand text-bark';
    }
  };

  const filteredQuoteRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return quoteRequests.filter((request) => {
      const matchesSearch = [
        request.full_name,
        request.email,
        request.phone,
      ].some((value) => value.toLowerCase().includes(query));

      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;

      const projectTypeValue = request.project_type ?? 'Not specified';
      const matchesProjectType = projectTypeFilter === 'all' || projectTypeValue === projectTypeFilter;

      return matchesSearch && matchesStatus && matchesProjectType;
    });
  }, [quoteRequests, searchQuery, statusFilter, projectTypeFilter]);

  const sortedQuoteRequests = useMemo(() => {
    const sorted = [...filteredQuoteRequests];

    sorted.sort((a, b) => {
      switch (sortOption) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'customer-az':
          return a.full_name.localeCompare(b.full_name);
        case 'customer-za':
          return b.full_name.localeCompare(a.full_name);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return sorted;
  }, [filteredQuoteRequests, sortOption]);

  const totalFilteredQuotes = sortedQuoteRequests.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredQuotes / ITEMS_PER_PAGE));
  const currentPageSafe = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const paginatedQuoteRequests = useMemo(() => {
    const startIndex = (currentPageSafe - 1) * ITEMS_PER_PAGE;
    return sortedQuoteRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedQuoteRequests, currentPageSafe]);

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));

  return (
    <>
      <section className="rounded-[2rem] border border-bark/10 bg-white p-6 shadow-soft">
        <div className="mb-6 space-y-4 lg:flex lg:items-end lg:justify-between lg:space-y-0">
          <div>
            <h2 className="text-2xl font-semibold text-bark">Quote Requests</h2>
            <p className="mt-2 text-sm leading-7 text-bark/70">
              All incoming quote requests ordered by newest first.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-4 sm:items-end sm:gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="quote-search" className="sr-only">
                Search quote requests
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-bark/40" />
                <input
                  id="quote-search"
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by name, email, phone"
                  className="w-full rounded-full border border-bark/10 bg-sand/80 px-12 py-3 text-sm text-bark outline-none transition placeholder:text-bark/40 focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                />
              </div>
            </div>

            <div>
              <label htmlFor="status-filter" className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-bark/60">
                Status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'all' | StatusOption)}
                className="w-full rounded-full border border-bark/10 bg-white px-4 py-3 text-sm text-bark outline-none transition focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
              >
                <option value="all">All statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="type-filter" className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-bark/60">
                Project type
              </label>
              <select
                id="type-filter"
                value={projectTypeFilter}
                onChange={(event) => setProjectTypeFilter(event.target.value)}
                className="w-full rounded-full border border-bark/10 bg-white px-4 py-3 text-sm text-bark outline-none transition focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
              >
                <option value="all">All project types</option>
                {projectTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sort-by" className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-bark/60">
                Sort by
              </label>
              <select
                id="sort-by"
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value as 'newest' | 'oldest' | 'customer-az' | 'customer-za' | 'status')}
                className="w-full rounded-full border border-bark/10 bg-white px-4 py-3 text-sm text-bark outline-none transition focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="customer-az">Customer A–Z</option>
                <option value="customer-za">Customer Z–A</option>
                <option value="status">Status</option>
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
                <p className="text-base font-semibold text-red-800">Unable to load quote requests</p>
                <p className="mt-2 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : quoteRequests.length === 0 ? (
          <div className="rounded-[1.5rem] border border-bark/10 bg-sand p-6 text-sm text-bark/70">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-oak-100 text-oak-700">
                <Inbox className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-bark">No quote requests yet</p>
                <p className="mt-2 text-sm text-bark/70">Once customers submit a quote, you’ll see it here.</p>
              </div>
            </div>
          </div>
        ) : filteredQuoteRequests.length === 0 ? (
          <div className="rounded-[1.5rem] border border-bark/10 bg-sand p-6 text-sm text-bark/70">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-oak-100 text-oak-700">
                <Inbox className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-bark">No quotes match the current filters.</p>
                <p className="mt-2 text-sm text-bark/70">Try adjusting your search or filter criteria.</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-[1.5rem] border border-bark/10 bg-white">
              <table className="min-w-full divide-y divide-bark/10 text-left text-sm">
                <thead className="bg-sand">
                  <tr>
                    <th className="px-4 py-4 font-semibold text-bark/80">Full Name</th>
                    <th className="px-4 py-4 font-semibold text-bark/80">Email</th>
                    <th className="px-4 py-4 font-semibold text-bark/80">Phone</th>
                    <th className="px-4 py-4 font-semibold text-bark/80">Project Type</th>
                    <th className="px-4 py-4 font-semibold text-bark/80">Status</th>
                    <th className="px-4 py-4 font-semibold text-bark/80">Created Date</th>
                    <th className="px-4 py-4 font-semibold text-bark/80">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bark/10 bg-white">
                  {paginatedQuoteRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-sand/50">
                      <td className="whitespace-nowrap px-4 py-4 text-bark">{request.full_name}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-bark/70">{request.email}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-bark/70">{request.phone}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-bark/70">{request.project_type ?? 'N/A'}</td>
                      <td className="px-4 py-4 text-bark/70">
                        <div className="space-y-1">
                          <select
                            value={request.status ?? 'pending'}
                            onChange={(event) => updateQuoteStatus(request.id, event.target.value as StatusOption)}
                            disabled={rowStatusSaving[request.id]}
                            className="w-full rounded-full border border-bark/10 bg-white px-3 py-2 text-sm text-bark outline-none transition focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          {rowStatusSaving[request.id] ? (
                            <p className="text-xs text-bark/60">Saving...</p>
                          ) : rowStatusErrors[request.id] ? (
                            <p className="text-xs text-red-700">{rowStatusErrors[request.id]}</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-bark/70">{formatDate(request.created_at)}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => loadQuoteDetails(request.id)}
                          disabled={selectedQuoteLoading}
                          className="rounded-full border border-bark/10 bg-sand/80 px-3 py-2 text-sm font-semibold text-bark transition hover:bg-bark/5 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {selectedQuoteLoading ? 'Loading…' : 'View'}
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
                  Page {currentPageSafe} of {totalPages} · {totalFilteredQuotes} filtered quote{totalFilteredQuotes === 1 ? '' : 's'}
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
      </section>

      {selectedQuote ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-bark/10 bg-white p-6 shadow-soft">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-bark">Quote details</h2>
                <p className="mt-2 text-sm leading-7 text-bark/70">
                  View the selected quote request details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuote(null)}
                className="inline-flex h-11 items-center justify-center rounded-full border border-bark/10 bg-sand px-4 py-2 text-sm font-semibold text-bark transition hover:bg-bark/5"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.5rem] border border-bark/10 bg-sand p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Full name</p>
                  <p className="mt-2 text-base font-semibold text-bark">{selectedQuote.full_name}</p>
                </div>
                <div className="rounded-[1.5rem] border border-bark/10 bg-sand p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Email</p>
                  <p className="mt-2 text-base font-semibold text-bark">{selectedQuote.email}</p>
                </div>
                <div className="rounded-[1.5rem] border border-bark/10 bg-sand p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Phone</p>
                  <p className="mt-2 text-base font-semibold text-bark">{selectedQuote.phone}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.5rem] border border-bark/10 bg-sand p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Project type</p>
                  <p className="mt-2 text-base font-semibold text-bark">{selectedQuote.project_type ?? 'N/A'}</p>
                </div>
                <div className="rounded-[1.5rem] border border-bark/10 bg-sand p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Room</p>
                  <p className="mt-2 text-base font-semibold text-bark">{selectedQuote.room_type ?? 'N/A'}</p>
                </div>
                <div className="rounded-[1.5rem] border border-bark/10 bg-sand p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Dimensions</p>
                  <p className="mt-2 text-base font-semibold text-bark">{selectedQuote.dimensions ?? 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[1.5rem] border border-bark/10 bg-sand p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Customer</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Full name</p>
                      <p className="mt-2 text-base font-semibold text-bark">{formatValue(selectedQuote.full_name)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Email</p>
                      <p className="mt-2 text-base font-semibold text-bark">{formatValue(selectedQuote.email)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Phone</p>
                      <p className="mt-2 text-base font-semibold text-bark">{formatValue(selectedQuote.phone)}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => selectedQuote.email && copyToClipboard(selectedQuote.email, 'email')}
                      disabled={!selectedQuote.email}
                      className="inline-flex items-center justify-center rounded-full border border-bark/10 bg-white px-4 py-3 text-sm font-semibold text-bark transition hover:bg-bark/5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Copy Email
                    </button>

                    <button
                      type="button"
                      onClick={() => selectedQuote.phone && copyToClipboard(selectedQuote.phone, 'phone')}
                      disabled={!selectedQuote.phone}
                      className="inline-flex items-center justify-center rounded-full border border-bark/10 bg-white px-4 py-3 text-sm font-semibold text-bark transition hover:bg-bark/5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Copy Phone
                    </button>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedQuote.id, 'quoteId')}
                      className="inline-flex items-center justify-center rounded-full border border-bark/10 bg-white px-4 py-3 text-sm font-semibold text-bark transition hover:bg-bark/5"
                    >
                      Copy Quote ID
                    </button>
                  </div>

                  <div className="mt-3 text-sm text-emerald-700">
                    {copiedField === 'email' && 'Copied!'}
                    {copiedField === 'phone' && 'Copied!'}
                    {copiedField === 'quoteId' && 'Copied!'}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {selectedQuote.email ? (
                      <a
                        href={`mailto:${selectedQuote.email}`}
                        className="inline-flex items-center justify-center rounded-full border border-bark/10 bg-white px-4 py-3 text-sm font-semibold text-bark transition hover:bg-bark/5"
                      >
                        Email Customer
                      </a>
                    ) : null}
                    {selectedQuote.phone ? (
                      <a
                        href={`tel:${selectedQuote.phone}`}
                        className="inline-flex items-center justify-center rounded-full border border-bark/10 bg-white px-4 py-3 text-sm font-semibold text-bark transition hover:bg-bark/5"
                      >
                        Call Customer
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-bark/10 bg-sand p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Project</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Project type</p>
                      <p className="mt-2 text-base font-semibold text-bark">{formatValue(selectedQuote.project_type)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Room</p>
                      <p className="mt-2 text-base font-semibold text-bark">{formatValue(selectedQuote.room_type)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Dimensions</p>
                      <p className="mt-2 text-base font-semibold text-bark">{formatValue(selectedQuote.dimensions)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Budget</p>
                      <p className="mt-2 text-base font-semibold text-bark">{formatValue(selectedQuote.budget)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Status</p>
                      <span className={`mt-2 inline-flex rounded-full px-3 py-2 text-sm font-semibold ${getStatusBadgeClass(selectedQuote.status)}`}>
                        {selectedQuote.status ?? 'Not provided'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-bark/10 bg-sand p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Configuration</p>
                  {selectedQuote.configurator_selections.length === 0 ? (
                    <p className="mt-4 text-base font-semibold text-bark">Not provided</p>
                  ) : (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Material</p>
                        <p className="mt-2 text-base font-semibold text-bark">{formatValue(selectedQuote.configurator_selections[0].material)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Finish</p>
                        <p className="mt-2 text-base font-semibold text-bark">{formatValue(selectedQuote.configurator_selections[0].finish)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Colour</p>
                        <p className="mt-2 text-base font-semibold text-bark">{formatValue(selectedQuote.configurator_selections[0].colour)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Estimated price</p>
                        <p className="mt-2 text-base font-semibold text-bark">
                          {selectedQuote.configurator_selections[0].estimated_price != null
                            ? `₦${selectedQuote.configurator_selections[0].estimated_price.toFixed(2)}`
                            : 'Not provided'}
                        </p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Accessories</p>
                        <p className="mt-2 text-base font-semibold text-bark">
                          {selectedQuote.configurator_selections[0].accessories
                            ? JSON.stringify(selectedQuote.configurator_selections[0].accessories)
                            : 'Not provided'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-[1.5rem] border border-bark/10 bg-sand p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Notes</p>
                  <p className="mt-3 text-base text-bark/70">{formatValue(selectedQuote.notes)}</p>
                </div>

                <div className="rounded-[1.5rem] border border-bark/10 bg-sand p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Metadata</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Quote ID</p>
                      <p className="mt-2 text-base font-semibold text-bark">{formatValue(selectedQuote.id)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Created date</p>
                      <p className="mt-2 text-base font-semibold text-bark">{formatDate(selectedQuote.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Last updated</p>
                      <p className="mt-2 text-base font-semibold text-bark">
                        {selectedQuote.updated_at ? formatDate(selectedQuote.updated_at) : formatDate(selectedQuote.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-bark/10 bg-sand p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Configurator selections</p>
                {selectedQuote.configurator_selections.length === 0 ? (
                  <p className="mt-3 text-sm text-bark/70">No configurator data.</p>
                ) : (
                  <div className="mt-3 space-y-4">
                    {selectedQuote.configurator_selections.map((selection, index) => (
                      <div key={index} className="rounded-[1.5rem] border border-bark/10 bg-white p-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Material</p>
                            <p className="mt-2 text-base font-semibold text-bark">{selection.material ?? 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Finish</p>
                            <p className="mt-2 text-base font-semibold text-bark">{selection.finish ?? 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Colour</p>
                            <p className="mt-2 text-base font-semibold text-bark">{selection.colour ?? 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Estimated price</p>
                            <p className="mt-2 text-base font-semibold text-bark">{selection.estimated_price != null ? `₦${selection.estimated_price.toFixed(2)}` : 'N/A'}</p>
                          </div>
                        </div>
                        <div className="mt-4 rounded-[1.5rem] border border-bark/10 bg-sand p-4">
                          <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Accessories</p>
                          <pre className="mt-2 overflow-auto text-sm text-bark/70">
                            {JSON.stringify(selection.accessories ?? {}, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
