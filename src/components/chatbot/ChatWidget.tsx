import { useEffect, useRef, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { ChatWindow, type ChatMessageItem } from './ChatWindow';
import { getChatResponse } from './chatKnowledge';
import chatbotIcon from '../../assets/chatbot-icon.png';

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

        <div className="group relative">
          <button
            type="button"
            aria-label={isOpen ? 'Close Oak Cherry Kraft chat' : 'Chat with Oak Cherry Kraft'}
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            onClick={() => setIsOpen((current) => !current)}
            className="relative inline-flex h-[120px] w-[120px] items-center justify-center rounded-full bg-transparent text-sand transition duration-200 ease-brand hover:scale-[1.05] hover:shadow-[0_0_0_12px_rgba(150,97,38,0.12)] active:scale-[0.96] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#d6a65d]/40 sm:h-[128px] sm:w-[128px] md:h-[136px] md:w-[136px] lg:h-[136px] lg:w-[136px] xl:h-[144px] xl:w-[144px]"
          >
            <img
              src={chatbotIcon}
              alt="Oak Cherry Kraft chat assistant"
              className="relative h-[100px] w-[100px] object-contain sm:h-[108px] sm:w-[108px] md:h-[116px] md:w-[116px] lg:h-[120px] lg:w-[120px] xl:h-[124px] xl:w-[124px]"
              loading="eager"
            />
            <span className="pointer-events-none absolute -right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#d7b38d] text-[#2e1d11] shadow-[0_0_0_2px_rgba(255,255,255,0.18)]">
              <MessageCircle className="h-3 w-3" strokeWidth={2} />
            </span>

            <span
              className={`pointer-events-none absolute bottom-2 right-2 h-2.5 w-2.5 rounded-full border border-white/80 bg-emerald-400 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
            />
          </button>

          <div className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 opacity-0 transition duration-200 ease-brand group-hover:opacity-100 group-focus-within:opacity-100">
            <span className="inline-flex whitespace-nowrap rounded-full bg-[#1f150e] px-3 py-1 text-xs font-medium text-white shadow-soft">
              Chat with Oak Cherry Kraft
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
