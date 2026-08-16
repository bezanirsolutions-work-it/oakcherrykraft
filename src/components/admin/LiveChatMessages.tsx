import { useEffect, useRef, useState } from 'react';
import { Download, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatFileSize, getFileIcon } from '../../lib/attachmentUtils';
import { normalizeAttachmentPath, requestAttachmentSignedUrl } from '../../lib/attachmentClient';

interface Message {
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

interface Session {
  id: string;
  visitor_name: string | null;
  visitor_email?: string | null;
  visitor_phone?: string | null;
  created_at?: string | null;
  status: string;
}

interface LiveChatMessagesProps {
  session: Session | null;
  messages: Message[];
  composer: string;
  onComposerChange: (value: string) => void;
  onSend: () => void;
  onExport: () => void;
  sending: boolean;
  exporting: boolean;
  feedback?: { rating: number; comment: string | null; created_at: string | null } | null;
}

function formatMessageTime(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function AttachmentPreview({ attachment }: { attachment: { name: string; type: string; size: number; path: string } }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const normalized = normalizeAttachmentPath(attachment.path);
        if (!normalized) throw new Error('Attachment could not be loaded.');
        const response = await requestAttachmentSignedUrl(normalized);
        if (!active) return;
        setSignedUrl(response.url);
        setError(null);
      } catch {
        if (!active) return;
        setError('Attachment could not be loaded.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [attachment.path]);

  if (loading) {
    return <div className="text-xs text-bark/60">Loading attachment...</div>;
  }

  if (error || !signedUrl) {
    return <span className="text-xs text-red-600">Attachment could not be loaded.</span>;
  }

  const isImage = attachment.type.startsWith('image/');

  if (isImage) {
    return (
      <a href={signedUrl} target="_blank" rel="noreferrer" className="block">
        <img src={signedUrl} alt={attachment.name} className="max-h-48 w-auto rounded-lg border border-bark/10 bg-white" />
      </a>
    );
  }

  return (
    <a
      href={signedUrl}
      target="_blank"
      rel="noreferrer"
      download={attachment.name}
      className="flex items-start gap-2 rounded-lg border border-bark/10 bg-white/70 p-2 text-left text-bark transition hover:bg-white"
    >
      <span className="text-lg leading-none">{getFileIcon(attachment.type)}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{attachment.name}</span>
        <span className="block text-[11px] text-bark/60">{formatFileSize(attachment.size)}</span>
      </span>
    </a>
  );
}

export function LiveChatMessages({
  session,
  messages,
  composer,
  onComposerChange,
  onSend,
  onExport,
  sending,
  exporting,
  feedback,
}: LiveChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [newCount, setNewCount] = useState(0);

  // Scroll behavior: only auto-scroll when near bottom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = distanceFromBottom < 160;

    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setNewCount(0);
    } else {
      // If not near bottom, increment indicator
      setNewCount((c) => c + 1);
    }
  }, [messages]);

  // Reset new count when user scrolls to bottom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onScroll = () => {
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      if (distanceFromBottom < 120) {
        setNewCount(0);
      }
    };
    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  if (!session) {
    return (
      <div className="flex w-full h-full flex-col items-center justify-center bg-white p-8 text-center">
        <div className="text-sm text-bark/60">Select a conversation to start responding</div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-full flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="border-b border-bark/10 px-6 py-4 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-bark">
              {session.visitor_name ?? 'Guest'}
            </h3>
            <p className="text-xs text-bark/60 mt-1">
              Status: <span className="font-medium capitalize">{session.status}</span>
            </p>
          </div>

          <Button
            type="button"
            onClick={onExport}
            disabled={!session || exporting}
            variant="secondary"
            size="sm"
            loading={exporting}
            icon={<Download size={14} aria-hidden="true" />}
            className="shrink-0"
            aria-label="Export conversation"
          >
            {exporting ? 'Exporting...' : 'Export Conversation'}
          </Button>
        </div>
        {feedback ? (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Visitor feedback</p>
            <p className="mt-1 text-sm text-emerald-900">{`${'★'.repeat(feedback.rating)}${'☆'.repeat(5 - feedback.rating)} (${feedback.rating}/5)`}</p>
            {feedback.comment ? <p className="mt-1 text-xs leading-5 text-emerald-800">{feedback.comment}</p> : null}
          </div>
        ) : null}
      </div>

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-6 py-4 min-w-0">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <p className="text-sm text-bark/60">No messages yet</p>
            </div>
          ) : (
            messages.map((msg) => {
              const attachments = Array.isArray(msg.metadata?.attachments) ? msg.metadata.attachments : [];

              return (
                <div
                  key={msg.id}
                  className={`flex ${msg.author === 'agent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md rounded-xl px-4 py-3 text-sm ${
                      msg.author === 'agent'
                        ? 'bg-oak-100 text-oak-900'
                        : 'bg-sand/60 text-bark'
                    }`}
                  >
                    {msg.content ? <p className="break-words">{msg.content}</p> : null}

                    {attachments.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {attachments.map((attachment) => (
                          <AttachmentPreview key={`${msg.id}-${attachment.path}`} attachment={attachment} />
                        ))}
                      </div>
                    ) : null}

                    <p className={`text-xs mt-1 ${
                      msg.author === 'agent'
                        ? 'text-oak-700/60'
                        : 'text-bark/60'
                    }`}>
                      {formatMessageTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}

          {feedback ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Visitor feedback</p>
              <p className="mt-1">{`${'★'.repeat(feedback.rating)}${'☆'.repeat(5 - feedback.rating)} (${feedback.rating}/5)`}</p>
              {feedback.comment ? <p className="mt-2 text-xs leading-5 text-emerald-800">{feedback.comment}</p> : null}
            </div>
          ) : null}

          <div ref={messagesEndRef} />
          {newCount > 0 ? (
            <div className="fixed bottom-32 right-6 z-40">
              <button
                onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="rounded-full bg-oak-600 px-3 py-2 text-sm font-medium text-white shadow"
              >
                New message{newCount > 1 ? `s (${newCount})` : ''}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-bark/10 px-6 py-4 flex-shrink-0">
        <div className="flex gap-3">
          <textarea
            value={composer}
            onChange={(e) => onComposerChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            rows={2}
            className="flex-1 resize-none rounded-lg border border-bark/10 bg-sand/30 px-4 py-3 text-sm text-bark placeholder-bark/40 outline-none transition focus:border-oak-600 focus:ring-2 focus:ring-oak-200"
          />
          <Button
            onClick={onSend}
            disabled={!composer.trim() || sending}
            variant="primary"
            className="self-end"
            aria-label="Send message"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
