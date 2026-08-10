import { useEffect, useRef, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { ChatWindow, type ChatMessageItem } from './ChatWindow';
import { getChatResponse } from './chatKnowledge';

const MAX_CONVERSATION_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 1200;
const TYPING_DELAY_MS = 250;
const GENERIC_ERROR_MESSAGE =
  "I'm sorry, I'm having trouble right now. Please try again in a moment, or contact Oak Cherry Kraft directly.";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'welcome',
      author: 'assistant',
      content:
        'Hi 👋 Welcome to Oak Cherry Kraft. I\'m here to help you find furniture, explore custom designs, or start a quote.',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const getRecentConversation = () =>
    messages
      .slice(-MAX_CONVERSATION_MESSAGES)
      .map(({ author, content }) => ({
        role: author,
        content: content.trim().slice(0, MAX_MESSAGE_LENGTH),
      }));

  const sendMessage = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isSending || isTyping || trimmed.length > MAX_MESSAGE_LENGTH) {
      return;
    }

    const conversation = getRecentConversation();
    const outgoingMessage: ChatMessageItem = {
      id: `user-${Date.now()}`,
      author: 'user',
      content: trimmed,
    };

    setMessages((current) => [...current, outgoingMessage]);
    setIsTyping(true);
    setIsSending(true);

    const response = getChatResponse(trimmed, conversation);
    const assistantMessage: ChatMessageItem = {
      id: `assistant-${Date.now()}`,
      author: 'assistant',
      content: response.message,
      actions: response.actions,
    };

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setMessages((current) => [...current, assistantMessage]);
      setIsTyping(false);
      setIsSending(false);
      timeoutRef.current = null;
    }, TYPING_DELAY_MS);
  };

  const handleQuickAction = (action: string) => {
    sendMessage(action);
  };

  const handleSend = (content: string) => {
    sendMessage(content);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-end px-4 sm:bottom-5 sm:px-6" style={{ paddingBottom: 'env(safe-area-inset-bottom, 1rem)' }}>
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        {isOpen ? (
          <div className="w-full max-w-[420px] sm:w-[420px] transition duration-300 ease-brand">
            <ChatWindow
              messages={messages}
              isTyping={isTyping}
              onClose={() => setIsOpen(false)}
              onSend={handleSend}
              onQuickAction={handleQuickAction}
            />
          </div>
        ) : null}

        <button
          type="button"
          aria-label={isOpen ? 'Close Oak Cherry Assistant' : 'Open Oak Cherry Assistant'}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-bark text-sand shadow-soft transition hover:-translate-y-0.5 hover:bg-bark/95 focus:outline-none focus-visible:ring-4 focus-visible:ring-oak-200"
        >
          <MessageCircle size={24} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
