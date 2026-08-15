import { useEffect, useRef, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { ChatWindow, type ChatMessageItem } from './ChatWindow';
import { getChatResponse } from './chatKnowledge';
import { ContactForm } from './ContactForm';
import {
  createSessionProxy,
  createMessageProxy,
  fetchSessionByTokenProxy,
  fetchMessagesProxy,
  subscribeToSessionEventsProxy,
  closeSessionProxy,
} from '../../lib/liveChatProxyClient';
import chatbotIcon from '../../assets/chatbot-icon.png';
import type { LiveChatMessage } from '../../lib/liveChat';

const MAX_CONVERSATION_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 1200;
const TYPING_DELAY_MS = 250;
const GENERIC_ERROR_MESSAGE =
  "I'm sorry, I'm having trouble right now. Please try again in a moment, or contact Oak Cherry Kraft directly.";

const generateVisitorToken = () => `visitor_${Math.random().toString(36).slice(2)}_${Date.now()}`;

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [visitorName, setVisitorName] = useState<string | undefined>(() => {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem('live-chat-visitor-name') ?? undefined : undefined;
    } catch {
      return undefined;
    }
  });
  const [visitorPhone, setVisitorPhone] = useState<string | undefined>(() => {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem('live-chat-visitor-phone') ?? undefined : undefined;
    } catch {
      return undefined;
    }
  });
  const [visitorEmail, setVisitorEmail] = useState<string | undefined>(() => {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem('live-chat-visitor-email') ?? undefined : undefined;
    } catch {
      return undefined;
    }
  });
  const [showContactForm, setShowContactForm] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  // Start with an empty message list — welcome UI is handled by `ChatWindow`'s welcome card
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const [liveChatSessionId, setLiveChatSessionId] = useState<string | null>(() => {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem('live-chat-session-id') ?? null : null;
    } catch {
      return null;
    }
  });
  const [isLiveChatActive, setIsLiveChatActive] = useState(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('live-chat-active') : null;
      return stored === 'true';
    } catch {
      return false;
    }
  });
  const [isConnectingLiveChat, setIsConnectingLiveChat] = useState(false);
  const sessionTokenRef = useRef<string>(
    (() => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('live-chat-visitor-token');
        if (stored) return stored;
      }
      return generateVisitorToken();
    })()
  );
  const liveChatSubscriptionRef = useRef<any | null>(null);
  const liveChatSessionSubscriptionRef = useRef<any | null>(null);
  const liveChatAbortControllerRef = useRef<AbortController | null>(null);
  const isMinimizedRef = useRef(false);

  // Persist visitor token to localStorage on first mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('live-chat-visitor-token', sessionTokenRef.current);
      }
    } catch {}
  }, []);

  // Restore and reconnect session after refresh
  useEffect(() => {
    if (liveChatSessionId && isLiveChatActive) {
      const reconnectToSession = async () => {
        try {
          const existing = await fetchSessionByTokenProxy(sessionTokenRef.current);
          if (!existing || existing.status === 'closed') {
            // Session closed or not found, reset state
            try {
              localStorage.removeItem('live-chat-session-id');
              localStorage.removeItem('live-chat-active');
            } catch {}
            setLiveChatSessionId(null);
            setIsLiveChatActive(false);
            return;
          }

          // Session exists and is active/pending, reconnect SSE and load messages
          console.log('[CHAT-REFRESH] restored session active, reconnecting SSE', { sessionId: liveChatSessionId });
          
          // Load existing messages
          const history = await fetchMessagesProxy(liveChatSessionId, sessionTokenRef.current);
          if (Array.isArray(history)) {
            const historyMessages = history.map((entry: LiveChatMessage): ChatMessageItem => ({
              id: `history-${entry.id}`,
              author: entry.author === 'visitor' ? 'user' : 'assistant',
              content: entry.content,
            }));
            setMessages(historyMessages);
          }

          // Reconnect SSE
          if (liveChatAbortControllerRef.current) {
            liveChatAbortControllerRef.current.abort();
          }
          const controller = new AbortController();
          liveChatAbortControllerRef.current = controller;

          console.log('[CHAT-REFRESH] subscribing to SSE for restored session', { sessionId: liveChatSessionId });
          void subscribeToSessionEventsProxy(
            liveChatSessionId,
            sessionTokenRef.current,
            {
              onMessage: (data) => {
                try {
                  const payload = data as { id?: string; content?: string; author?: string; session_id?: string };
                  const matchesSession = !payload.session_id || payload.session_id === liveChatSessionId;
                  const content = typeof payload?.content === 'string' ? payload.content : '';

                  if (
                    matchesSession &&
                    payload &&
                    payload.id &&
                    content.length > 0 &&
                    payload.author !== 'visitor'
                  ) {
                    const nextMessage: ChatMessageItem = {
                      id: `agent-${payload.id}`,
                      author: 'assistant',
                      content,
                    };

                    setMessages((cur) => {
                      // Check against CURRENT state, not captured state
                      const isDuplicate = !!payload.id && cur.some((message) => message.id === `agent-${payload.id}`);
                      if (isDuplicate) {
                        return cur; // Return current state unchanged
                      }
                      return [...cur, nextMessage];
                    });
                    if (isMinimizedRef.current) {
                      setUnreadCount((current) => current + 1);
                    }
                  }
                } catch (_) {}
              },
              onHistory: (data) => {
                try {
                  const history = data as LiveChatMessage[];
                  if (Array.isArray(history)) {
                    setMessages((cur) => {
                      const newMessages = history
                        .filter((m) => !cur.some((msg) => msg.id === `history-${m.id}`))
                        .map((m): ChatMessageItem => ({
                          id: `history-${m.id}`,
                          author: m.author === 'visitor' ? 'user' : 'assistant',
                          content: m.content,
                        }));
                      return newMessages.length > 0 ? [...cur, ...newMessages] : cur;
                    });
                  }
                } catch (_) {}
              },
              onSession: (data) => {
                try {
                  const payload = data as { status?: string };
                  if (payload.status === 'active') {
                    setMessages((cur) => [
                      ...cur,
                      {
                        id: `assistant-active-${Date.now()}`,
                        author: 'assistant',
                        content: `You're now connected with Oak Cherry Kraft.`,
                      },
                    ]);
                  }
                  if (payload.status === 'resolved' || payload.status === 'closed') {
                    setIsOpen(false);
                    setIsMinimized(false);
                    setIsLiveChatActive(false);
                    try {
                      localStorage.removeItem('live-chat-session-id');
                      localStorage.removeItem('live-chat-active');
                    } catch {}
                    setMessages((cur) => [
                      ...cur,
                      {
                        id: `assistant-session-${Date.now()}`,
                        author: 'assistant',
                        content:
                          'Live chat session has ended. If you need anything else, I am still here to help.',
                      },
                    ]);
                  }
                } catch (_) {}
              },
              onError: () => {
                console.log('[CHAT-REFRESH] SSE error during restore');
              },
            },
            controller.signal
          );
        } catch (err) {
          console.warn('[CHAT-REFRESH] Failed to restore session:', err);
        }
      };
      reconnectToSession();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      supabaseChannelCleanup();
    };
  }, []);

  useEffect(() => {
    isMinimizedRef.current = isMinimized;
  }, [isMinimized]);

  const supabaseChannelCleanup = () => {
    try {
      if (
        liveChatSubscriptionRef.current &&
        typeof liveChatSubscriptionRef.current.unsubscribe === 'function'
      ) {
        liveChatSubscriptionRef.current.unsubscribe();
      }
    } catch {
      /* ignore */
    }

    try {
      if (
        liveChatSessionSubscriptionRef.current &&
        typeof liveChatSessionSubscriptionRef.current.unsubscribe === 'function'
      ) {
        liveChatSessionSubscriptionRef.current.unsubscribe();
      }
    } catch {
      /* ignore */
    }

    if (liveChatAbortControllerRef.current) {
      liveChatAbortControllerRef.current.abort();
      liveChatAbortControllerRef.current = null;
    }
  };

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
    messages.slice(-MAX_CONVERSATION_MESSAGES).map(({ author, content }) => ({
      role: author,
      content: content.trim().slice(0, MAX_MESSAGE_LENGTH),
    }));

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isSending || isTyping || trimmed.length > MAX_MESSAGE_LENGTH) {
      return;
    }
    // If live chat is active, send via proxy to live chat messages and don't run bot response
    if (isLiveChatActive && liveChatSessionId) {
      const outgoingMessage: ChatMessageItem = {
        id: `visitor-${Date.now()}`,
        author: 'user',
        content: trimmed,
      };

      setMessages((current) => [...current, outgoingMessage]);

      try {
        await createMessageProxy(liveChatSessionId, sessionTokenRef.current, 'visitor', trimmed);
      } catch (err) {
        console.error('Failed to send live chat message', err);
        setMessages((cur) => [
          ...cur,
          {
            id: `assistant-error-${Date.now()}`,
            author: 'assistant',
            content: 'Failed to send message. Please try again.',
          },
        ]);
      }

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

  const handleQuickAction = (action: string | { href: string; type?: string }) => {
    if (typeof action !== 'string' && action.type === 'live') {
      showLiveContactForm();
      return;
    }

    const value = typeof action === 'string' ? action : action.href;
    sendMessage(value);
  };

  const showLiveContactForm = async () => {
    if (isLiveChatActive || showContactForm) return;
    
    console.log('[live-chat-contact-form] checking for existing session');
    
    try {
      // Check if there's an existing non-closed session
      const existing = await fetchSessionByTokenProxy(sessionTokenRef.current);
      if (existing && existing.status !== 'closed') {
        // Active session exists, skip form and go directly to live chat
        console.log('[live-chat-contact-form] existing active session found, skipping form');
        await startLiveChat();
        return;
      }
    } catch (err) {
      console.warn('[live-chat-contact-form] failed to check existing session', err);
    }
    
    console.log('[live-chat-contact-form] showing contact form');
    setShowContactForm(true);
  };

  const handleContactFormSubmit = async (details: { name: string; phone: string; email: string }) => {
    try {
      setIsConnectingLiveChat(true);

      // Save contact details to localStorage
      try {
        localStorage.setItem('live-chat-visitor-name', details.name);
        localStorage.setItem('live-chat-visitor-phone', details.phone);
        localStorage.setItem('live-chat-visitor-email', details.email);
      } catch {
        console.warn('Failed to save contact details to localStorage');
      }

      // Update state
      setVisitorName(details.name);
      setVisitorPhone(details.phone);
      setVisitorEmail(details.email);

      // Hide contact form and proceed with live chat
      setShowContactForm(false);

      // Create the session with contact details
      await startLiveChat(details);
    } finally {
      setIsConnectingLiveChat(false);
    }
  };

  const startLiveChat = async (contactDetails?: { name: string; phone: string; email: string }) => {
    if (isLiveChatActive) return;
    
    console.log('[live-chat-start-debug] "Speak to Our Team" clicked');
    console.log('[live-chat-start-debug] visitor token:', sessionTokenRef.current ? 'present' : 'undefined');
    
    const proxyEnv = import.meta.env.VITE_LIVE_CHAT_PROXY_URL;
    if (!proxyEnv && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      console.error(
        'VITE_LIVE_CHAT_PROXY_URL is not set in the environment. Live chat proxy unavailable.'
      );
      setMessages((cur) => [
        ...cur,
        {
          id: `assistant-error-${Date.now()}`,
          author: 'assistant',
          content: GENERIC_ERROR_MESSAGE,
        },
      ]);
      return;
    }

    try {
      console.log('[live-chat-start-debug] checking for existing session');
      const existing = await fetchSessionByTokenProxy(sessionTokenRef.current);
      console.log('[live-chat-start-debug] existing session query result:', existing ? 'found' : 'not found');
      if (existing) {
        console.log('[live-chat-start-debug] existing session status:', existing.status);
      }
      
      let session = existing;
      if (existing) {
        if (existing.status === 'closed') {
          console.log('[live-chat-start-debug] existing session is closed, creating new session');
          session = await createSessionProxy(sessionTokenRef.current, { 
            name: contactDetails?.name || visitorName,
            phone: contactDetails?.phone || visitorPhone,
            email: contactDetails?.email || visitorEmail,
          });
        } else if (contactDetails || (visitorName && (existing.visitor_name == null || existing.visitor_name !== visitorName))) {
          try {
            console.log('[live-chat-start-debug] updating visitor details on existing session');
            session = await createSessionProxy(sessionTokenRef.current, { 
              name: contactDetails?.name || visitorName,
              phone: contactDetails?.phone || visitorPhone,
              email: contactDetails?.email || visitorEmail,
            });
          } catch (err) {
            console.warn('Failed to update session with visitor details', err);
          }
        }
      } else {
        console.log('[live-chat-start-debug] no existing session, creating new one');
        session = await createSessionProxy(sessionTokenRef.current, { 
          name: contactDetails?.name || visitorName,
          phone: contactDetails?.phone || visitorPhone,
          email: contactDetails?.email || visitorEmail,
        });
      }
      
      console.log('[live-chat-start-debug] session created/reused:', {
        sessionId: session?.id ?? 'undefined',
        status: session?.status ?? 'undefined',
      });
      
      if (!session || !session.id) {
        throw new Error('Session creation failed: no session ID returned');
      }
      
      setLiveChatSessionId(session.id);
      try {
        localStorage.setItem('live-chat-session-id', session.id);
        localStorage.setItem('live-chat-active', 'true');
      } catch {}
      console.info('[live-chat-session] current session', { sessionId: session.id });
      setIsLiveChatActive(true);

      console.log('[live-chat-start-debug] fetching message history');
      const history = await fetchMessagesProxy(session.id, sessionTokenRef.current);
      console.log('[live-chat-start-debug] history fetch result:', {
        isArray: Array.isArray(history),
        count: Array.isArray(history) ? history.length : 0,
      });
      
      if (Array.isArray(history)) {
        const historyMessages = history.map((entry: LiveChatMessage): ChatMessageItem => ({
          id: `history-${entry.id}`,
          author: entry.author === 'visitor' ? 'user' : 'assistant',
          content: entry.content,
        }));

        console.info('[live-chat-session] history loaded', {
          sessionId: session.id,
          count: historyMessages.length,
        });

        setMessages((current) => [...current, ...historyMessages]);
      }

      setMessages((current) => [
        ...current,
        {
          id: `assistant-live-${Date.now()}`,
          author: 'assistant',
          content: `You're now connected to OAKIES. A member of our team will join shortly.`,
        },
      ]);

      if (liveChatAbortControllerRef.current) {
        liveChatAbortControllerRef.current.abort();
      }
      const controller = new AbortController();
      liveChatAbortControllerRef.current = controller;

      console.log('[live-chat-start-debug] starting SSE subscription');
      void subscribeToSessionEventsProxy(
        session.id,
        sessionTokenRef.current,
        {
          onMessage: (data) => {
            try {
              const payload = data as { id?: string; content?: string; author?: string; session_id?: string };
              const matchesSession = !payload.session_id || payload.session_id === session.id;
              const content = typeof payload?.content === 'string' ? payload.content : '';

              console.info('[live-chat-events] customer message received', {
                sessionId: session.id,
                incomingMessageId: payload.id ?? null,
                incomingAuthor: payload.author ?? null,
                beforeCount: messages.length,
                matchesSession,
              });
              console.info('[SESSION-TRACE][CHATWIDGET-ONMESSAGE]', {
                activeSessionId: session.id,
                payloadSessionId: payload.session_id ?? null,
                payloadAuthor: payload.author ?? null,
                payloadId: payload.id ?? null,
                content,
                matchesSession,
                willSetMessages: !!(
                  matchesSession &&
                  payload &&
                  payload.id &&
                  content.length > 0 &&
                  payload.author !== 'visitor'
                ),
              });

              if (
                matchesSession &&
                payload &&
                payload.id &&
                content.length > 0 &&
                payload.author !== 'visitor'
              ) {
                const nextMessage: ChatMessageItem = {
                  id: `agent-${payload.id}`,
                  author: 'assistant',
                  content,
                };

                setMessages((cur) => {
                  // Check against CURRENT state, not captured state, to avoid stale closure bugs
                  const isDuplicate = !!payload.id && cur.some((message) => message.id === `agent-${payload.id}`);

                  if (isDuplicate) {
                    console.info('[live-chat-events] rejected duplicate', {
                      sessionId: session.id,
                      messageId: payload.id,
                      reason: 'duplicate message id',
                    });
                    return cur; // Return current state unchanged
                  }

                  console.info('[live-chat-events] state update', {
                    sessionId: session.id,
                    beforeCount: cur.length,
                    afterCount: cur.length + 1,
                    messageId: payload.id ?? null,
                    uiAuthor: 'assistant',
                  });
                  return [...cur, nextMessage];
                });

                if (isMinimizedRef.current) {
                  setUnreadCount((current) => current + 1);
                }
              } else {
                console.info('[live-chat-events] customer message rejected', {
                  sessionId: session.id,
                  incomingMessageId: payload.id ?? null,
                  incomingAuthor: payload.author ?? null,
                  reason: matchesSession ? 'message rejected by guard' : 'session mismatch',
                });
              }
            } catch (_) {}
          },
          onHistory: (data) => {
            try {
              const history = data as LiveChatMessage[];
              if (Array.isArray(history)) {
                setMessages((cur) => {
                  const newMessages = history
                    .filter((m) => !cur.some((msg) => msg.id === `history-${m.id}`))
                    .map((m): ChatMessageItem => ({
                      id: `history-${m.id}`,
                      author: m.author === 'visitor' ? 'user' : 'assistant',
                      content: m.content,
                    }));
                  return newMessages.length > 0 ? [...cur, ...newMessages] : cur;
                });
              }
            } catch (_) {}
          },
          onSession: (data) => {
            try {
              const payload = data as { status?: string };
              if (payload.status === 'active') {
                setMessages((cur) => [
                  ...cur,
                  {
                    id: `assistant-active-${Date.now()}`,
                    author: 'assistant',
                    content: `You're now connected with Oak Cherry Kraft.`,
                  },
                ]);
              }
              if (payload.status === 'resolved' || payload.status === 'closed') {
                setIsOpen(false);
                setIsMinimized(false);
                setIsLiveChatActive(false);
                try {
                  localStorage.removeItem('live-chat-session-id');
                  localStorage.removeItem('live-chat-active');
                } catch {}
                setMessages((cur) => [
                  ...cur,
                  {
                    id: `assistant-session-${Date.now()}`,
                    author: 'assistant',
                    content:
                      'Live chat session has ended. If you need anything else, I am still here to help.',
                  },
                ]);
              }
            } catch (_) {}
          },
          onError: () => {
            console.log('[live-chat-start-debug] SSE error handler called');
          },
        },
        controller.signal
      );
      console.log('[live-chat-start-debug] SSE subscription initiated');
    } catch (err) {
      console.error('[live-chat-start-debug] EXCEPTION in startLiveChat:', {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : 'no stack',
      });
      setMessages((cur) => [
        ...cur,
        {
          id: `assistant-error-${Date.now()}`,
          author: 'assistant',
          content: GENERIC_ERROR_MESSAGE,
        },
      ]);
    }
  };

  const handleSend = (content: string) => {
    sendMessage(content);
  };

  const handleRestore = () => {
    if (isMinimized) {
      setIsMinimized(false);
      setUnreadCount(0);
      return;
    }

    setIsOpen((current) => !current);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    if (isLiveChatActive && liveChatSessionId) {
      void (async () => {
        try {
          await closeSessionProxy(liveChatSessionId, sessionTokenRef.current);
        } catch (err) {
          console.warn('Failed to close live chat session via proxy', err);
        }
      })();
    }
    setIsLiveChatActive(false);
    try {
      localStorage.removeItem('live-chat-session-id');
      localStorage.removeItem('live-chat-active');
    } catch {}
    supabaseChannelCleanup();
  };

  const handleMinimize = () => {
    if (!isMinimized) {
      setIsMinimized(true);
    }
  };

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-end px-4 sm:bottom-2 sm:px-6"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 1rem)' }}
    >
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        {isOpen ? (
          <div className="transition duration-300 ease-brand" style={{ width: 'min(680px, calc(100vw - 24px))' }}>
            <div className={isMinimized ? 'hidden' : ''}>
              {showContactForm ? (
                <div className="flex flex-col overflow-hidden p-0 shadow-soft sm:rounded-[2rem] bg-white">
                  <div className="flex items-center justify-between gap-4 border-b border-bark/10 bg-sand px-4 py-3">
                    <div className="flex items-center gap-3">
                      {chatbotIcon ? (
                        <img src={chatbotIcon} alt="Oak Cherry Kraft" className="h-10 w-10 rounded-lg object-contain" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-[1.25rem] bg-oak-100 text-oak-700 text-lg font-semibold">OC</div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-bark">Oak Cherry Kraft</p>
                        <p className="text-xs text-bark/70">● Typically reply in a few minutes</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClose}
                      aria-label="Close chat window"
                      title="Close chat"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-bark/20 bg-white/95 text-bark shadow-sm shadow-bark/10 transition hover:bg-sand focus:outline-none focus-visible:ring-2 focus-visible:ring-bark/40"
                    >
                      <span className="text-lg">×</span>
                    </button>
                  </div>
                  <div className="flex flex-1 flex-col overflow-hidden bg-white">
                    <ContactForm 
                      onSubmit={handleContactFormSubmit}
                      isLoading={isConnectingLiveChat}
                    />
                  </div>
                </div>
              ) : (
                <ChatWindow
                  messages={messages}
                  isTyping={isTyping}
                  onClose={handleClose}
                  onMinimize={handleMinimize}
                  onSend={handleSend}
                  onQuickAction={handleQuickAction}
                  isLiveChatActive={isLiveChatActive}
                  logoSrc={chatbotIcon}
                />
              )}
            </div>
          </div>
        ) : null}

          <div className="group relative">
            {isMinimized ? (
              <div className="pointer-events-auto">
                <button
                  type="button"
                  onClick={handleRestore}
                  aria-label="Restore OAKIES chat"
                  title="Restore chat"
                  className="inline-flex items-center gap-3 min-w-[220px] max-w-[360px] rounded-full bg-white/95 border border-bark/10 px-4 py-2 shadow-md hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-bark/20"
                >
                  <img src={chatbotIcon} alt="Oak Cherry Kraft" className="h-10 w-10 rounded-md object-contain" />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold text-bark">OAKIES</div>
                    <div className="text-xs text-bark/60">You may have new messages</div>
                  </div>
                  {unreadCount > 0 ? (
                    <div className="ml-2 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-emerald-400 px-2 text-xs font-medium text-white">
                      {unreadCount}
                    </div>
                  ) : null}
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  aria-label={isOpen ? 'Close OAKIES chat' : 'Chat with OAKIES'}
                  aria-expanded={isOpen && !isMinimized}
                  aria-haspopup="dialog"
                  onClick={handleRestore}
                  className="relative inline-flex h-[88px] w-[88px] items-center justify-center rounded-full bg-transparent text-sand transition duration-200 ease-brand hover:scale-[1.05] hover:shadow-[0_0_0_10px_rgba(150,97,38,0.10)] active:scale-[0.96] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#d6a65d]/30 sm:h-[96px] sm:w-[96px] md:h-[104px] md:w-[104px] lg:h-[104px] lg:w-[104px] xl:h-[112px] xl:w-[112px]"
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
                    Chat with OAKIES
                  </span>
                </div>
              </>
            )}
          </div>
      </div>
    </div>
  );
}
