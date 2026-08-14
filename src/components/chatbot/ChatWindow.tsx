import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Minus, X, ArrowRight } from 'lucide-react';
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
  onMinimize: () => void;
  onSend: (message: string) => void;
  onQuickAction: (action: string | ChatAction) => void;
  isLiveChatActive?: boolean;
  logoSrc?: string;
}

const quickActions = [
  'Explore Furniture',
  'Design Something Custom',
  'Request a Quote',
  'Speak to Our Team',
];

export function ChatWindow({ messages, isTyping, onClose, onMinimize, onSend, onQuickAction, isLiveChatActive, logoSrc }: ChatWindowProps) {
  const [draft, setDraft] = useState('');
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);

  // Show the welcome / quick-actions card when there are no conversation messages yet
  const showQuickActions = messages.length === 0;

  useEffect(() => {
    console.info('[chat-window] render', {
      messageCount: messages.length,
      isTyping,
      latestAuthor: messages[messages.length - 1]?.author ?? null,
      latestId: messages[messages.length - 1]?.id ?? null,
    });
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
    <Card
      className="flex flex-col overflow-hidden p-0 shadow-soft sm:rounded-[2rem]"
      // increase visible coverage while keeping room for controls and the floating button
      style={{ width: 'min(680px, calc(100vw - 24px))', height: 'min(820px, calc(100vh - 120px))' }}
    >
      <div className="flex items-center justify-between gap-4 border-b border-bark/10 bg-sand px-4 py-3">
        <div className="flex items-center gap-3">
          {logoSrc ? (
            <img src={logoSrc} alt="Oak Cherry Kraft" className="h-10 w-10 rounded-lg object-contain" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-[1.25rem] bg-oak-100 text-oak-700 text-lg font-semibold">OC</div>
          )}
          <div>
            <p id="chatbot-title" className="text-sm font-semibold text-bark">OAKIES</p>
            <p className="text-xs text-bark/70">Your Oak Cherry Kraft Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMinimize}
            aria-label="Minimize chat"
            title="Minimize chat"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-bark/20 bg-white/95 text-bark shadow-sm shadow-bark/10 transition hover:bg-sand focus:outline-none focus-visible:ring-2 focus-visible:ring-bark/40"
          >
            <Minus size={16} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat window"
            title="Close chat"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-bark/20 bg-white/95 text-bark shadow-sm shadow-bark/10 transition hover:bg-sand focus:outline-none focus-visible:ring-2 focus-visible:ring-bark/40"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden bg-white px-4 py-2">
        <div
          ref={messageListRef}
          role="log"
          aria-live="polite"
          className="flex-1 min-h-0 overflow-y-auto pr-2 pb-2"
        >
          <div className="space-y-3">
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
                  <p className="mb-2 text-sm font-semibold text-bark">OAKIES is typing…</p>
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
                  <p className="text-sm font-semibold text-bark">Welcome 👋</p>

                  <p className="mt-2 text-sm leading-7 text-bark/75">Let’s find something that fits your space beautifully. I can help you explore our furniture, create something custom, get a quote, or connect you with our team.</p>

                  <div className="mt-3 text-sm text-bark/80">
                    <p className="mb-1">I can help you:</p>
                    <ul className="ml-4 list-disc">
                      <li>explore furniture</li>
                      <li>create something custom</li>
                      <li>get a quote</li>
                      <li>connect with our team</li>
                    </ul>
                  </div>

                  <p className="mt-3 text-sm leading-7 text-bark/75">Where would you like to start?</p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {quickActions.map((action) => (
                      <Button
                        key={action}
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          action === 'Speak to Our Team'
                            ? onQuickAction({ href: 'start-live-chat', type: 'live' } as any)
                            : onQuickAction(action)
                        }
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

        <div className="mt-3">
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
