import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';
import type { ChatAction } from './chatKnowledge';

export interface ChatMessageItem {
  id: string;
  author: 'assistant' | 'user';
  content: string;
  actions?: ChatAction[];
}

interface ChatWindowProps {
  messages: ChatMessageItem[];
  isTyping: boolean;
  onClose: () => void;
  onSend: (message: string) => void;
  onQuickAction: (action: string | ChatAction) => void;
}

const quickActions = [
  'Explore Products',
  'Custom Furniture',
  'Start a Quote',
  'Talk to a Human',
];

export function ChatWindow({ messages, isTyping, onClose, onSend, onQuickAction }: ChatWindowProps) {
  const [draft, setDraft] = useState('');
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);

  const showQuickActions = messages.length === 1;

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }
    onSend(trimmed);
    setDraft('');
  };

  return (
    <Card className="flex h-[min(90vh,calc(100vh-5rem))] w-full max-w-[420px] flex-col overflow-hidden p-0 shadow-soft sm:rounded-[2rem]">
      <div className="flex items-center justify-between gap-4 border-b border-bark/10 bg-sand px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.5rem] bg-oak-100 text-oak-700 text-lg font-semibold">
            OC
          </div>
          <div>
            <p id="chatbot-title" className="text-sm font-semibold text-bark">Oak Cherry Assistant</p>
            <p className="text-xs text-bark/70">Here to help</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat window"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-bark/10 bg-white text-bark shadow-sm transition hover:bg-sand focus:outline-none focus-visible:ring-4 focus-visible:ring-oak-200"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden bg-white px-5 py-4">
        <div
          ref={messageListRef}
          role="log"
          aria-live="polite"
          className="flex-1 overflow-y-auto pr-1 pb-4"
        >
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-3">
                <ChatMessage author={message.author} content={message.content} />
                {message.author === 'assistant' && message.actions?.length ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {message.actions.map((action) => {
                      const actionElement = action.external ? (
                        <Button asChild variant={action.variant ?? 'secondary'} size="sm" className="w-full">
                          <a
                            href={action.href}
                            target={action.href.startsWith('http') ? '_blank' : undefined}
                            rel={action.href.startsWith('http') ? 'noreferrer' : undefined}
                            className="inline-flex w-full items-center justify-center"
                          >
                            {action.label}
                          </a>
                        </Button>
                      ) : action.type === 'live' ? (
                        <Button
                          type="button"
                          variant={action.variant ?? 'secondary'}
                          size="sm"
                          className="w-full"
                          onClick={() => onQuickAction(action)}
                        >
                          {action.label}
                        </Button>
                      ) : (
                        <Button asChild variant={action.variant ?? 'secondary'} size="sm" className="w-full">
                          <Link to={action.href}>{action.label}</Link>
                        </Button>
                      );

                      return <div key={`${message.id}-${action.href}-${action.label}`}>{actionElement}</div>;
                    })}
                  </div>
                ) : null}
              </div>
            ))}

            {isTyping ? (
              <div className="flex justify-start">
                <div className="rounded-[1.75rem] border border-bark/10 bg-sand px-4 py-3 text-sm text-bark shadow-sm">
                  <p className="mb-2 text-sm font-semibold text-bark">Oak Cherry Assistant is typing…</p>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-bark/70 animate-bounce" style={{ animationDelay: '0s' }} />
                    <span className="h-2 w-2 rounded-full bg-bark/70 animate-bounce" style={{ animationDelay: '0.12s' }} />
                    <span className="h-2 w-2 rounded-full bg-bark/70 animate-bounce" style={{ animationDelay: '0.24s' }} />
                  </div>
                </div>
              </div>
            ) : null}

            {showQuickActions ? (
              <div className="rounded-[1.75rem] border border-bark/10 bg-sand p-4">
                <p className="text-sm font-semibold text-bark">Welcome to Oak Cherry Kraft</p>
                <p className="mt-2 text-sm leading-7 text-bark/75">
                  Welcome to Oak Cherry Kraft! 👋 I'm the Oak Cherry Assistant. I can help you explore our furniture, learn about custom options, configure your furniture requirements, request a quote, or connect you with our team.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {quickActions.map((action) => (
                    <Button
                      key={action}
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onQuickAction(action)}
                      className="justify-start"
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <div ref={messageEndRef} />
        </div>

        <div className="mt-4">
          <ChatInput
            value={draft}
            onChange={setDraft}
            onSend={handleSend}
            disabled={isTyping}
          />
        </div>
      </div>
    </Card>
  );
}
