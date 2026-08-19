import { useEffect, useId, useMemo, useState } from 'react';
import { Search, RotateCcw, Eye, Download } from 'lucide-react';
import { fetchAllLiveChatFeedback, LiveChatFeedbackWithSession } from '../../lib/liveChat';
import { useDialogFocus } from './useDialogFocus';

interface FeedbackPanelProps {
  onSelectSession?: (sessionId: string) => void;
  loading?: boolean;
}

export function LiveChatFeedbackPanel({ onSelectSession, loading: externalLoading = false }: FeedbackPanelProps) {
  const [feedback, setFeedback] = useState<LiveChatFeedbackWithSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<LiveChatFeedbackWithSession | null>(null);
  const [dateFilterType, setDateFilterType] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const feedbackTitleId = useId();
  const { dialogRef: feedbackDialogRef } = useDialogFocus(selectedFeedback !== null, () => setSelectedFeedback(null));

  const loadFeedback = async () => {
    setLoading(true);
    setError(null);
    try {
      // Calculate date filters
      const now = new Date();
      let startDate: string | undefined;
      
      if (dateFilterType === 'today') {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        startDate = start.toISOString();
      } else if (dateFilterType === '7days') {
        const start = new Date(now);
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        startDate = start.toISOString();
      } else if (dateFilterType === '30days') {
        const start = new Date(now);
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        startDate = start.toISOString();
      }

      const result = await fetchAllLiveChatFeedback({
        rating: ratingFilter || undefined,
        search: searchQuery || undefined,
        startDate,
        limit: 1000,
      });

      setFeedback(result.data ?? []);
    } catch (err) {
      console.error('Failed to load feedback:', err);
      setError(err instanceof Error ? err.message : 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, [ratingFilter, dateFilterType]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSearching(true);
    try {
      const result = await fetchAllLiveChatFeedback({
        rating: ratingFilter || undefined,
        search: query || undefined,
        limit: 1000,
      });
      setFeedback(result.data ?? []);
    } catch (err) {
      console.error('Failed to search feedback:', err);
    } finally {
      setSearching(false);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (feedback.length === 0) {
      return {
        totalResponses: 0,
        averageRating: 0,
        fiveStarCount: 0,
        lowRatingCount: 0,
      };
    }

    const totalResponses = feedback.length;
    const averageRating = feedback.reduce((sum, fb) => sum + fb.rating, 0) / totalResponses;
    const fiveStarCount = feedback.filter((fb) => fb.rating === 5).length;
    const lowRatingCount = feedback.filter((fb) => fb.rating < 3).length;

    return {
      totalResponses,
      averageRating: Math.round(averageRating * 10) / 10,
      fiveStarCount,
      lowRatingCount,
    };
  }, [feedback]);

  const getRatingLabel = (rating: number): string => {
    switch (rating) {
      case 1:
        return 'Very dissatisfied';
      case 2:
        return 'Dissatisfied';
      case 3:
        return 'Neutral';
      case 4:
        return 'Satisfied';
      case 5:
        return 'Very satisfied';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRatingStars = (rating: number): string => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const exportFeedback = () => {
    try {
      const lines: string[] = [
        'Oak Cherry Kraft - Customer Feedback Report',
        `Generated: ${formatDate(new Date().toISOString())}`,
        `Total Responses: ${stats.totalResponses}`,
        `Average Rating: ${stats.averageRating}/5`,
        '',
        '---',
      ];

      for (const fb of feedback) {
        lines.push('');
        lines.push(`Rating: ${getRatingStars(fb.rating)} (${fb.rating}/5)`);
        lines.push(`Label: ${getRatingLabel(fb.rating)}`);
        lines.push(`Visitor: ${fb.live_chat_sessions?.visitor_name || 'Guest'}`);
        lines.push(`Email: ${fb.live_chat_sessions?.visitor_email || 'N/A'}`);
        lines.push(`Session ID: ${fb.session_id}`);
        lines.push(`Date: ${formatDate(fb.created_at)}`);
        if (fb.comment) {
          lines.push(`Comment: ${fb.comment}`);
        }
      }

      lines.push('');
      lines.push('---');
      lines.push('End of Report');

      const content = lines.join('\n');
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `feedback-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export feedback:', error);
      alert('Failed to export feedback');
    }
  };

  return (
    <div className="flex w-full h-full flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="border-b border-bark/10 px-4 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-bark">Customer Feedback</h2>
          <button
            onClick={loadFeedback}
            disabled={loading}
            className="p-2 text-bark/60 hover:text-bark transition disabled:opacity-50"
            title="Refresh feedback"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="rounded-lg bg-sand/50 p-3">
            <div className="text-xs text-bark/70">Total Responses</div>
            <div className="text-xl font-bold text-oak-700">{stats.totalResponses}</div>
          </div>
          <div className="rounded-lg bg-sand/50 p-3">
            <div className="text-xs text-bark/70">Average Rating</div>
            <div className="text-xl font-bold text-oak-700">{stats.averageRating}/5</div>
          </div>
          <div className="rounded-lg bg-green-50 p-3">
            <div className="text-xs text-bark/70">5-Star Ratings</div>
            <div className="text-xl font-bold text-green-700">{stats.fiveStarCount}</div>
          </div>
          <div className="rounded-lg bg-yellow-50 p-3">
            <div className="text-xs text-bark/70">Low Ratings (&lt;3)</div>
            <div className="text-xl font-bold text-yellow-700">{stats.lowRatingCount}</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <label htmlFor="feedback-search" className="sr-only">Search feedback</label>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bark/40" />
            <input
              id="feedback-search"
              type="text"
              placeholder="Search feedback, visitor, email..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              disabled={searching}
              className="w-full rounded-lg border border-bark/10 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-bark/40 focus:outline-none focus:ring-2 focus:ring-oak-400"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex gap-2 flex-wrap">
            {/* Rating filter */}
            <div className="flex gap-1">
              <button
                onClick={() => setRatingFilter(null)}
                className={`px-2 py-1 text-xs rounded-full transition ${
                  ratingFilter === null
                    ? 'bg-oak-600 text-white'
                    : 'bg-bark/10 text-bark hover:bg-bark/20'
                }`}
              >
                All
              </button>
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setRatingFilter(rating)}
                  className={`px-2 py-1 text-xs rounded-full transition ${
                    ratingFilter === rating
                      ? 'bg-oak-600 text-white'
                      : 'bg-bark/10 text-bark hover:bg-bark/20'
                  }`}
                >
                  {rating}★
                </button>
              ))}
            </div>

            {/* Date filter */}
            <select
              value={dateFilterType}
              onChange={(e) => setDateFilterType(e.target.value as any)}
              className="px-2 py-1 text-xs rounded-full border border-bark/10 bg-white text-bark focus:outline-none focus:ring-2 focus:ring-oak-400"
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
            </select>

            {/* Export */}
            <button
              onClick={exportFeedback}
              className="px-3 py-1 text-xs rounded-full bg-bark/10 text-bark hover:bg-bark/20 transition flex items-center gap-1"
            >
              <Download className="h-3 w-3" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-4 text-sm text-red-700 bg-red-50 border-b border-red-200">
            {error}
            <button
              onClick={loadFeedback}
              className="ml-2 font-medium underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {loading || externalLoading ? (
          <div className="flex items-center justify-center h-32 text-bark/40">
            <div className="text-center">
              <div className="animate-spin h-6 w-6 border-2 border-oak-400 border-t-oak-700 rounded-full mx-auto mb-2"></div>
              <div className="text-sm">Loading feedback...</div>
            </div>
          </div>
        ) : feedback.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-bark/40">
            <div className="text-center">
              <div className="text-sm mb-1">No feedback yet</div>
              <div className="text-xs text-bark/70">Feedback will appear here after visitors complete the chat feedback form</div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-bark/10">
            {feedback.map((fb) => (
              <div
                key={fb.id}
                className="p-4 hover:bg-sand/50 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-oak-600">{getRatingStars(fb.rating)}</span>
                      <span className="text-xs text-bark/70">{fb.rating}/5</span>
                    </div>
                    <div className="text-sm text-bark truncate">
                      {fb.live_chat_sessions?.visitor_name || 'Guest'}
                    </div>
                    <div className="text-xs text-bark/70">
                      {fb.live_chat_sessions?.visitor_email || 'No email'}
                    </div>
                    {fb.comment && (
                      <div className="text-xs text-bark/70 mt-1 line-clamp-2">
                        {fb.comment}
                      </div>
                    )}
                    <div className="text-xs text-bark/70 mt-1">
                      {formatDate(fb.created_at)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFeedback(fb);
                    }}
                    className="p-2 text-bark/70 hover:text-bark transition flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-oak-200"
                    title="View details"
                    aria-label="View feedback details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedFeedback && (
        <div
          ref={feedbackDialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={feedbackTitleId}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-[1.75rem] shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 border-b border-bark/10 bg-white px-6 py-4 flex items-center justify-between rounded-t-[1.75rem]">
              <h3 id={feedbackTitleId} className="font-semibold text-bark">Feedback Details</h3>
              <button
                type="button"
                onClick={() => setSelectedFeedback(null)}
                data-dialog-initial-focus
                aria-label="Close feedback details"
                className="text-bark/70 hover:text-bark transition text-2xl leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-oak-200"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Rating */}
              <div>
                <div className="text-xs font-medium text-bark/70 mb-1">Rating</div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-medium text-oak-600">{getRatingStars(selectedFeedback.rating)}</span>
                  <span className="text-sm text-bark">
                    {selectedFeedback.rating}/5 - {getRatingLabel(selectedFeedback.rating)}
                  </span>
                </div>
              </div>

              {/* Visitor Info */}
              <div>
                <div className="text-xs font-medium text-bark/70 mb-2">Visitor</div>
                <div className="space-y-1 text-sm">
                  <div className="text-bark">
                    {selectedFeedback.live_chat_sessions?.visitor_name || 'Guest'}
                  </div>
                  {selectedFeedback.live_chat_sessions?.visitor_email && (
                    <div className="text-bark/70">{selectedFeedback.live_chat_sessions.visitor_email}</div>
                  )}
                  {selectedFeedback.live_chat_sessions?.visitor_phone && (
                    <div className="text-bark/70">{selectedFeedback.live_chat_sessions.visitor_phone}</div>
                  )}
                </div>
              </div>

              {/* Session Info */}
              <div>
                <div className="text-xs font-medium text-bark/70 mb-2">Conversation</div>
                <div className="space-y-1 text-sm">
                  <div className="font-mono text-bark/70 text-xs break-all">
                    {selectedFeedback.session_id}
                  </div>
                  <div className="text-bark/70">
                    Status: <span className="capitalize">{selectedFeedback.live_chat_sessions?.status || 'Unknown'}</span>
                  </div>
                  <div className="text-bark/70">
                    Started: {formatDate(selectedFeedback.live_chat_sessions?.created_at || null)}
                  </div>
                </div>
              </div>

              {/* Comment */}
              {selectedFeedback.comment && (
                <div>
                  <div className="text-xs font-medium text-bark/70 mb-2">Comment</div>
                  <div className="p-3 bg-sand/50 rounded-lg text-sm text-bark whitespace-pre-wrap break-words">
                    {selectedFeedback.comment}
                  </div>
                </div>
              )}

              {/* Submission Date */}
              <div>
                <div className="text-xs font-medium text-bark/70 mb-1">Submitted</div>
                <div className="text-sm text-bark">
                  {formatDate(selectedFeedback.created_at)}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-bark/10 flex gap-2">
                <button
                  onClick={() => {
                    if (onSelectSession) {
                      onSelectSession(selectedFeedback.session_id);
                      setSelectedFeedback(null);
                    }
                  }}
                  className="flex-1 rounded-full bg-oak-600 text-white px-4 py-2 font-medium text-sm transition hover:bg-oak-700"
                >
                  View Conversation
                </button>
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="flex-1 rounded-full border border-bark/10 bg-white text-bark px-4 py-2 font-medium text-sm transition hover:bg-sand"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
