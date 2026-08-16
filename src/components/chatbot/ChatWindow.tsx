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
  attachments?: Array<{ name: string; type: string; size: number; path: string }>;
}

interface ChatWindowProps {
  messages: ChatMessageItem[];
  isTyping: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onSend: (message: string, attachments: File[]) => void;
  onQuickAction: (action: string | ChatAction) => void;
  isLiveChatActive?: boolean;
  logoSrc?: string;
  showFeedbackForm?: boolean;
  feedbackRating?: number | null;
  feedbackComment?: string;
  feedbackSubmitting?: boolean;
  onFeedbackRatingChange?: (value: number | null) => void;
  onFeedbackCommentChange?: (value: string) => void;
  onFeedbackSubmit?: () => void;
  onFeedbackDismiss?: () => void;
}

const quickActions = [
  'Explore Furniture',
  'Design Something Custom',
  'Request a Quote',
  'Speak to Our Team',
];

export function ChatWindow({
  messages,
  isTyping,
  onClose,
  onMinimize,
  onSend,
  onQuickAction,
  isLiveChatActive,
  logoSrc,
  showFeedbackForm = false,
  feedbackRating = null,
  feedbackComment = '',
  feedbackSubmitting = false,
  onFeedbackRatingChange,
  onFeedbackCommentChange,
  onFeedbackSubmit,
  onFeedbackDismiss,
}: ChatWindowProps) {
  const [draft, setDraft] = useState('');
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);

  // Show the welcome / quick-actions card when there are no conversation messages yet
  const showQuickActions = messages.length === 0;

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (message: string, attachments: File[]) => {
    const trimmed = message.trim();
    if (!trimmed && attachments.length === 0) {
      return;
    }
    onSend(trimmed, attachments);
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
                <ChatMessage author={message.author} content={message.content} attachments={message.attachments} />
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

        {showFeedbackForm ? (
          <div className="mt-3 rounded-[1.5rem] border border-bark/10 bg-sand/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-bark">How was your experience?</p>
                <p className="mt-1 text-xs text-bark/60">A quick rating helps us improve.</p>
              </div>
              {onFeedbackDismiss ? (
                <button
                  type="button"
                  onClick={onFeedbackDismiss}
                  className="text-lg leading-none text-bark/60 transition hover:text-bark"
                  aria-label="Dismiss feedback form"
                >
                  ×
                </button>
              ) : null}
            </div>

            <div className="mt-4 flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onFeedbackRatingChange?.(value)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition ${feedbackRating === value ? 'border-oak-600 bg-oak-600 text-white' : 'border-bark/20 bg-white text-bark hover:border-oak-300'}`}
                  aria-label={`Rate ${value} out of 5`}
                >
                  {value}
                </button>
              ))}
            </div>

            <textarea
              value={feedbackComment}
              onChange={(event) => onFeedbackCommentChange?.(event.target.value.slice(0, 1000))}
              rows={3}
              placeholder="Optional comments..."
              className="mt-4 w-full resize-none rounded-xl border border-bark/10 bg-white px-3 py-2 text-sm text-bark placeholder-bark/40 focus:border-oak-600 focus:outline-none focus:ring-2 focus:ring-oak-200"
            />

            <div className="mt-4 flex justify-end gap-2">
              {onFeedbackDismiss ? (
                <button
                  type="button"
                  onClick={onFeedbackDismiss}
                  className="rounded-full border border-bark/20 bg-white px-4 py-2 text-sm text-bark/70 transition hover:bg-sand"
                >
                  Skip
                </button>
              ) : null}
              <button
                type="button"
                onClick={onFeedbackSubmit}
                disabled={!feedbackRating || feedbackSubmitting}
                className="rounded-full bg-oak-600 px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:bg-oak-300"
              >
                {feedbackSubmitting ? 'Sending...' : 'Submit'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <ChatInput
              value={draft}
              onChange={setDraft}
              onSend={handleSend}
              disabled={isTyping}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
