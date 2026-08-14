import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../ui/Button';

interface Message {
  id: string;
  author: 'visitor' | 'assistant' | 'agent' | 'system';
  content: string;
  created_at: string | null;
}

interface Session {
  id: string;
  visitor_name: string | null;
  status: string;
}

interface LiveChatMessagesProps {
  session: Session | null;
  messages: Message[];
  composer: string;
  onComposerChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
}

function formatMessageTime(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function LiveChatMessages({
  session,
  messages,
  composer,
  onComposerChange,
  onSend,
  sending,
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
        <div>
          <h3 className="text-base font-semibold text-bark">
            {session.visitor_name ?? 'Guest'}
          </h3>
          <p className="text-xs text-bark/60 mt-1">
            Status: <span className="font-medium capitalize">{session.status}</span>
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-6 py-4 min-w-0">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <p className="text-sm text-bark/60">No messages yet</p>
            </div>
          ) : (
            messages.map((msg) => (
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
                  <p className="break-words">{msg.content}</p>
                  <p className={`text-xs mt-1 ${
                    msg.author === 'agent'
                      ? 'text-oak-700/60'
                      : 'text-bark/60'
                  }`}>
                    {formatMessageTime(msg.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
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
