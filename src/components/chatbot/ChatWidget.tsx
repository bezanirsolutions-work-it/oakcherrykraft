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
  submitSessionFeedbackProxy,
} from '../../lib/liveChatProxyClient';
import { uploadAttachments } from '../../lib/attachmentClient';
import chatbotIcon from '../../assets/chatbot-icon-mobile.webp';
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
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const feedbackPromptSuppressedRef = useRef(false);
  const feedbackSubmittedRef = useRef(false);

  useEffect(() => {
    feedbackSubmittedRef.current = feedbackSubmitted;
  }, [feedbackSubmitted]);

  useEffect(() => {
    if (!feedbackSubmitted) return;

    const timeout = window.setTimeout(() => {
      setFeedbackSubmitted(false);
      feedbackSubmittedRef.current = false;
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [feedbackSubmitted]);

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
  const liveChatSseCleanupRef = useRef<(() => void) | null>(null);
  const startingLiveChatRef = useRef(false);
  const subscriptionGenerationRef = useRef(0);
  const connectedSystemMessageSessionIdsRef = useRef<Set<string>>(new Set());
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
            try {
              localStorage.removeItem('live-chat-session-id');
              localStorage.removeItem('live-chat-active');
            } catch {}
            setLiveChatSessionId(null);
            setIsLiveChatActive(false);
            return;
          }



          const history = await fetchMessagesProxy(liveChatSessionId, sessionTokenRef.current);
          if (Array.isArray(history)) {
            const historyMessages = history.map((entry: LiveChatMessage): ChatMessageItem => ({
              id: `history-${entry.id}`,
              author: entry.author === 'visitor' ? 'user' : 'assistant',
              content: entry.content,
            }));
            setMessages((cur) => {
              const seen = new Set(cur.map((message) => message.id));
              const newMessages = historyMessages.filter((message) => !seen.has(message.id));
              return newMessages.length > 0 ? [...cur, ...newMessages] : cur;
            });
          }

          cleanupActiveSseSubscription();
          const controller = new AbortController();
          liveChatAbortControllerRef.current = controller;
          const generation = ++subscriptionGenerationRef.current;

          const cleanup = subscribeToSessionEventsProxy(
            liveChatSessionId,
            sessionTokenRef.current,
            {
              onMessage: (data) => {
                if (generation !== subscriptionGenerationRef.current) {
                  return;
                }
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
                      const isDuplicate = !!payload.id && cur.some((message) => message.id === `agent-${payload.id}`);
                      if (isDuplicate) {
                        return cur;
                      }
                      const nextState = [...cur, nextMessage];
                      return nextState;
                    });
                    if (isMinimizedRef.current) {
                      setUnreadCount((current) => current + 1);
                    }
                  }
                } catch (_) {}
              },
              onHistory: (data) => {
                if (generation !== subscriptionGenerationRef.current) {
                  return;
                }
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
                if (generation !== subscriptionGenerationRef.current) {
                  return;
                }
                try {
                  const payload = data as { status?: string };
                  if (payload.status === 'active') {
                    addConnectedSystemMessage(liveChatSessionId);
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
              onError: () => {},

            },
            controller.signal
          );
          liveChatSseCleanupRef.current = () => {
            controller.abort();
            cleanup?.();
          };
        } catch (err) {

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
      cleanupActiveSseSubscription();
      supabaseChannelCleanup();
    };
  }, []);

  useEffect(() => {
    return () => {
      cleanupActiveSseSubscription();
      liveChatSseCleanupRef.current = null;
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

  const cleanupActiveSseSubscription = () => {
    liveChatSseCleanupRef.current?.();
    liveChatSseCleanupRef.current = null;
  };

  const addConnectedSystemMessage = (sessionId: string) => {
    if (!sessionId) return;
    if (connectedSystemMessageSessionIdsRef.current.has(sessionId)) {
      return;
    }
    connectedSystemMessageSessionIdsRef.current.add(sessionId);
    const systemMessage = {
      id: `assistant-live-${Date.now()}`,
      author: 'assistant' as const,
      content: `You're now connected with Oak Cherry Kraft.`,
    };
    setMessages((cur) => [...cur, systemMessage]);
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

  const sendMessage = async (content: string, attachments: File[] = []) => {
    const trimmed = content.trim();
    if (!trimmed && attachments.length === 0) {
      return;
    }
    if (isSending || isTyping || (trimmed && trimmed.length > MAX_MESSAGE_LENGTH)) {
      return;
    }
    // If live chat is active, send via proxy to live chat messages and don't run bot response
    if (isLiveChatActive && liveChatSessionId) {
      setIsSending(true);
      try {
        // Upload attachments and get metadata
        let attachmentMetadata: any[] = [];
        if (attachments.length > 0) {
          try {
            attachmentMetadata = await uploadAttachments(attachments, liveChatSessionId, sessionTokenRef.current);
          } catch (err) {
            console.error('Failed to upload attachments', err);
            setMessages((cur) => [
              ...cur,
              {
                id: `assistant-error-${Date.now()}`,
                author: 'assistant',
                content: 'Failed to upload files. Please try again.',
              },
            ]);
            setIsSending(false);
            return;
          }
        }

        const outgoingMessage: ChatMessageItem = {
          id: `visitor-${Date.now()}`,
          author: 'user',
          content: trimmed,
          attachments: attachmentMetadata,
        };

        setMessages((current) => [...current, outgoingMessage]);

        try {
          await createMessageProxy(liveChatSessionId, sessionTokenRef.current, 'visitor', trimmed, attachmentMetadata);
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
      } finally {
        setIsSending(false);
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
    
    try {
      // Check if there's an existing non-closed session
      const existing = await fetchSessionByTokenProxy(sessionTokenRef.current);
      if (existing && existing.status !== 'closed') {
        // Active session exists, skip form and go directly to live chat
        await startLiveChat();
        return;
      }
    } catch (err) {
    }
    
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
    if (startingLiveChatRef.current || isLiveChatActive) {
      return;
    }

    resetFeedbackState();
    startingLiveChatRef.current = true;

    try {
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

      const existing = await fetchSessionByTokenProxy(sessionTokenRef.current);
      let session = existing;
      if (existing) {
        if (existing.status === 'closed') {
          session = await createSessionProxy(sessionTokenRef.current, {
            name: contactDetails?.name || visitorName,
            phone: contactDetails?.phone || visitorPhone,
            email: contactDetails?.email || visitorEmail,
          });
        } else if (contactDetails || (visitorName && (existing.visitor_name == null || existing.visitor_name !== visitorName))) {
          try {
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
        session = await createSessionProxy(sessionTokenRef.current, {
          name: contactDetails?.name || visitorName,
          phone: contactDetails?.phone || visitorPhone,
          email: contactDetails?.email || visitorEmail,
        });
      }

      if (!session || !session.id) {
        throw new Error('Session creation failed: no session ID returned');
      }

      setLiveChatSessionId(session.id);
      try {
        localStorage.setItem('live-chat-session-id', session.id);
        localStorage.setItem('live-chat-active', 'true');
      } catch {}
      setIsLiveChatActive(true);

      const history = await fetchMessagesProxy(session.id, sessionTokenRef.current);

      if (Array.isArray(history)) {
        const historyMessages = history.map((entry: LiveChatMessage): ChatMessageItem => ({
          id: `history-${entry.id}`,
          author: entry.author === 'visitor' ? 'user' : 'assistant',
          content: entry.content,
        }));

        setMessages((current) => {
          const seen = new Set(current.map((message) => message.id));
          const newMessages = historyMessages.filter((message) => !seen.has(message.id));
          return newMessages.length > 0 ? [...current, ...newMessages] : current;
        });
      }

      addConnectedSystemMessage(session.id);

      cleanupActiveSseSubscription();
      const controller = new AbortController();
      liveChatAbortControllerRef.current = controller;
      const generation = ++subscriptionGenerationRef.current;

      const cleanup = subscribeToSessionEventsProxy(
        session.id,
        sessionTokenRef.current,
        {
          onMessage: (data) => {
            if (generation !== subscriptionGenerationRef.current) {
              return;
            }
            try {
              const payload = data as { id?: string; content?: string; author?: string; session_id?: string };
              const matchesSession = !payload.session_id || payload.session_id === session.id;
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
                  const isDuplicate = !!payload.id && cur.some((message) => message.id === `agent-${payload.id}`);
                  if (isDuplicate) {
                    return cur;
                  }

                  const nextState = [...cur, nextMessage];
                  return nextState;
                });

                if (isMinimizedRef.current) {
                  setUnreadCount((current) => current + 1);
                }
              } else {
              }
            } catch (_) {}
          },
          onHistory: (data) => {
            if (generation !== subscriptionGenerationRef.current) {
              return;
            }
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
            if (generation !== subscriptionGenerationRef.current) {
              return;
            }
            try {
              const payload = data as { status?: string };
              if (payload.status === 'active') {
                addConnectedSystemMessage(session.id);
              }
              if (payload.status === 'resolved' || payload.status === 'closed') {
                if (feedbackPromptSuppressedRef.current || feedbackSubmittedRef.current) {
                  setShowFeedbackForm(false);
                  return;
                }
                setIsMinimized(false);
                setIsLiveChatActive(false);
                setShowFeedbackForm(true);
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
          onError: () => {},
        },
        controller.signal
      );
      liveChatSseCleanupRef.current = () => {
        controller.abort();
        cleanup?.();
      };
    } catch (err) {
      setMessages((cur) => [
        ...cur,
        {
          id: `assistant-error-${Date.now()}`,
          author: 'assistant',
          content: GENERIC_ERROR_MESSAGE,
        },
      ]);
    } finally {
      startingLiveChatRef.current = false;
    }
  };

  const handleSend = (content: string, attachments: File[]) => {
    sendMessage(content, attachments);
  };

  const handleRestore = () => {
    if (isMinimized) {
      setIsMinimized(false);
      setUnreadCount(0);
      return;
    }

    setIsOpen((current) => !current);
  };

  const resetFeedbackState = () => {
    feedbackPromptSuppressedRef.current = false;
    feedbackSubmittedRef.current = false;
    setShowFeedbackForm(false);
    setFeedbackRating(null);
    setFeedbackComment('');
    setFeedbackSubmitted(false);
    setFeedbackSubmitting(false);
  };

  const handleClose = () => {
    // If we need to show feedback after closing, keep the window open
    if (isLiveChatActive && liveChatSessionId && !feedbackPromptSuppressedRef.current && !feedbackSubmittedRef.current) {
      setIsMinimized(false);
      // Keep isOpen = true so feedback form can be shown
      void (async () => {
        try {
          await closeSessionProxy(liveChatSessionId, sessionTokenRef.current);
        } catch (err) {
          console.warn('Failed to close live chat session via proxy', err);
        }
      })();
      feedbackPromptSuppressedRef.current = false;
      setFeedbackRating(null);
      setFeedbackComment('');
      setFeedbackSubmitted(false);
      setShowFeedbackForm(true);
    } else {
      // No feedback to show, fully close the window
      setIsOpen(false);
      setIsMinimized(false);
      resetFeedbackState();
    }
    setIsLiveChatActive(false);
    try {
      localStorage.removeItem('live-chat-session-id');
      localStorage.removeItem('live-chat-active');
    } catch {}
    cleanupActiveSseSubscription();
    supabaseChannelCleanup();
  };

  const handleFeedbackSubmit = async () => {
    if (!liveChatSessionId || !feedbackRating || feedbackSubmitting) {
      return;
    }

    setFeedbackSubmitting(true);
    setShowFeedbackForm(false);
    setFeedbackComment('');
    setFeedbackRating(null);

    try {
      await submitSessionFeedbackProxy(liveChatSessionId, sessionTokenRef.current, feedbackRating, feedbackComment);
      feedbackPromptSuppressedRef.current = true;
      feedbackSubmittedRef.current = true;
      setShowFeedbackForm(false);
      setFeedbackSubmitted(true);
      
      // Close the chat window after showing the thank you message
      const timer = window.setTimeout(() => {
        setIsOpen(false);
      }, 3500);
      
      return () => window.clearTimeout(timer);
    } catch (err) {
      console.warn('Failed to submit live chat feedback', err);
      feedbackPromptSuppressedRef.current = false;
      feedbackSubmittedRef.current = false;
      setShowFeedbackForm(true);
      setFeedbackRating(feedbackRating);
      setFeedbackComment(feedbackComment);
    } finally {
      setFeedbackSubmitting(false);
    }
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
                        <img
                          src={chatbotIcon}
                          alt="Oak Cherry Kraft"
                          className="h-10 w-10 rounded-lg object-contain"
                          width={40}
                          height={40}
                          loading="lazy"
                          decoding="async"
                        />
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
                <>
                  <ChatWindow
                    messages={messages}
                    isTyping={isTyping}
                    onClose={handleClose}
                    onMinimize={handleMinimize}
                    onSend={handleSend}
                    onQuickAction={handleQuickAction}
                    isLiveChatActive={isLiveChatActive}
                    logoSrc={chatbotIcon}
                    showFeedbackForm={showFeedbackForm}
                    feedbackRating={feedbackRating}
                    feedbackComment={feedbackComment}
                    feedbackSubmitting={feedbackSubmitting}
                    onFeedbackRatingChange={setFeedbackRating}
                    onFeedbackCommentChange={setFeedbackComment}
                    onFeedbackSubmit={handleFeedbackSubmit}
                    onFeedbackDismiss={() => setShowFeedbackForm(false)}
                  />
                  {feedbackSubmitted ? (
                    <div className="mt-3 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-soft">
                      Thanks for your feedback — it helps us improve the experience.
                    </div>
                  ) : null}
                </>
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
                  <img
                    src={chatbotIcon}
                    alt="Oak Cherry Kraft"
                    className="h-10 w-10 rounded-md object-contain"
                    width={40}
                    height={40}
                    loading="lazy"
                    decoding="async"
                  />
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
                    width={124}
                    height={124}
                    loading="lazy"
                    decoding="async"
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
