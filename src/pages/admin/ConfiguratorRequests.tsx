import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Search } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../../lib/supabase';
import { Button, EmptyState, LoadingState } from '../../components/ui';

interface QuoteReference {
  id: string;
  full_name: string | null;
  email: string | null;
  status: string | null;
}

interface ConfiguratorRequestRow {
  id: string;
  quote_request_id: string | null;
  material: string | null;
  finish: string | null;
  colour: string | null;
  accessories: string[] | null;
  estimated_price: number | null;
  created_at: string | null;
  quote_requests?: QuoteReference;
}

export function ConfiguratorRequests() {
  const [requests, setRequests] = useState<ConfiguratorRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('configurator_selections')
        .select(
          `id, quote_request_id, material, finish, colour, accessories, estimated_price, created_at, quote_requests(id, full_name, email, status)`
        )
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        setRequests([]);
      } else {
        setRequests((data as ConfiguratorRequestRow[] | null) ?? []);
      }

      setLoading(false);
    };

    loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return requests;

    return requests.filter((request) => {
      const fields = [
        request.quote_request_id,
        request.material,
        request.finish,
        request.colour,
        request.accessories?.join(', '),
        request.quote_requests?.full_name,
        request.quote_requests?.email,
        request.quote_requests?.status,
      ];

      return fields.some((value) => typeof value === 'string' && value.toLowerCase().includes(query));
    });
  }, [requests, searchQuery]);

  return (
    <>
      <Helmet>
        <title>Configurator Requests | Oak Cherry Kraft Admin</title>
      </Helmet>

      <section className="rounded-[2rem] border border-bark/10 bg-white p-6 shadow-soft">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-bark">Configurator Requests</h2>
            <p className="mt-2 text-sm leading-7 text-bark/70">
              Review saved design requests generated from the Design Your Furniture workflow.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-4">
            <label htmlFor="configurator-search" className="sr-only">
              Search configurator requests
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-bark/40" />
              <input
                id="configurator-search"
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by customer, material, or quote ID"
                className="w-full rounded-full border border-bark/10 bg-sand/80 px-12 py-3 text-sm text-bark outline-none transition placeholder:text-bark/40 focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
              />
            </div>
            <Button
              type="button"
              onClick={() => setSearchQuery('')}
              variant="secondary"
              className="shrink-0"
            >
              Clear
            </Button>
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-6 shadow-soft">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-semibold text-red-800">Unable to load configurator requests</p>
                <p className="mt-2 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            title={requests.length === 0 ? 'No configurator requests yet' : 'No results found'}
            description={
              requests.length === 0
                ? 'Visitors will see configurator requests here after they finish the Design Your Furniture workflow.'
                : 'Try a different search term to locate relevant requests.'
            }
          />
        ) : (
          <div className="overflow-hidden rounded-[1.5rem] border border-bark/10 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-bark/10 text-left text-sm">
              <thead className="bg-sand">
                <tr>
                  <th className="px-4 py-4 font-semibold text-bark/80">Request ID</th>
                  <th className="px-4 py-4 font-semibold text-bark/80">Customer</th>
                  <th className="px-4 py-4 font-semibold text-bark/80">Material</th>
                  <th className="px-4 py-4 font-semibold text-bark/80">Finish</th>
                  <th className="px-4 py-4 font-semibold text-bark/80">Colour</th>
                  <th className="px-4 py-4 font-semibold text-bark/80">Price estimate</th>
                  <th className="px-4 py-4 font-semibold text-bark/80">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bark/10 bg-white">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-sand/50 transition-colors">
                    <td className="px-4 py-4 font-medium text-bark">{request.quote_request_id ?? request.id}</td>
                    <td className="px-4 py-4 text-bark/75">
                      <div>{request.quote_requests?.full_name ?? 'Unknown'}</div>
                      <div className="text-xs text-bark/50">{request.quote_requests?.email ?? 'No email'}</div>
                    </td>
                    <td className="px-4 py-4 text-bark/75">{request.material ?? '—'}</td>
                    <td className="px-4 py-4 text-bark/75">{request.finish ?? '—'}</td>
                    <td className="px-4 py-4 text-bark/75">{request.colour ?? '—'}</td>
                    <td className="px-4 py-4 text-bark/75">{request.estimated_price != null ? `₦${request.estimated_price.toFixed(0)}` : 'Not estimated'}</td>
                    <td className="px-4 py-4 text-bark/75">{request.created_at ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(request.created_at)) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
