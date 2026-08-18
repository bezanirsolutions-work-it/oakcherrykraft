import { supabase } from './supabase';
import type { Database } from './database';

export type LiveChatSessionStatus = 'pending' | 'active' | 'resolved' | 'closed';

export interface LiveChatSession {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  status: LiveChatSessionStatus;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  visitor_token: string;
  assigned_agent_id: string | null;
  last_activity_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface LiveChatAttachment {
  name: string;
  type: string;
  size: number;
  path: string;
}

export interface LiveChatMessage {
  id: string;
  session_id: string;
  created_at: string | null;
  author: 'visitor' | 'assistant' | 'agent' | 'system';
  content: string;
  metadata: {
    attachments?: LiveChatAttachment[];
  } | null;
}

export interface LiveChatFeedback {
  id: string;
  session_id: string;
  rating: number;
  comment: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface LiveChatFeedbackWithSession extends LiveChatFeedback {
  live_chat_sessions: {
    id: string;
    visitor_name: string | null;
    visitor_email: string | null;
    visitor_phone: string | null;
    status: string;
    created_at: string | null;
    assigned_agent_id: string | null;
  } | null;
}

export async function createLiveChatSession(visitorToken: string, visitorDetails?: {
  name?: string;
  email?: string;
  phone?: string;
}): Promise<LiveChatSession> {
  const payload = {
    visitor_token: visitorToken,
    visitor_name: visitorDetails?.name ?? null,
    visitor_email: visitorDetails?.email ?? null,
    visitor_phone: visitorDetails?.phone ?? null,
    status: 'pending' as const,
    last_activity_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('live_chat_sessions')
    .insert(payload)
    .select('*')
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create live chat session');
  }

  return data as LiveChatSession;
}

export async function createLiveChatMessage(sessionId: string, author: LiveChatMessage['author'], content: string) {
  const payload = {
    session_id: sessionId,
    author,
    content,
  };

  const { data, error } = await supabase
    .from('live_chat_messages')
    .insert(payload)
    .select('*')
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create live chat message');
  }

  return data as LiveChatMessage;
}

export async function fetchLiveChatSessionByToken(visitorToken: string) {
  const { data, error } = await supabase
    .from('live_chat_sessions')
    .select('*')
    .eq('visitor_token', visitorToken)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as LiveChatSession | null;
}

export async function fetchLiveChatMessages(sessionId: string) {
  const { data, error } = await supabase
    .from('live_chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as LiveChatMessage[];
}

export async function updateLiveChatSessionStatus(sessionId: string, status: LiveChatSessionStatus) {
  const { data, error } = await supabase
    .from('live_chat_sessions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .select('*')
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to update live chat session status');
  }

  return data as LiveChatSession;
}

export async function fetchAllLiveChatSessions(status?: LiveChatSessionStatus) {
  const proxyUrl = import.meta.env.VITE_LIVE_CHAT_PROXY_URL;

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    console.info('[liveChat] fetchAllLiveChatSessions start', {
      status: status ?? null,
      hasProxyUrl: Boolean(proxyUrl),
      hasSession: Boolean(session),
      userId: session?.user?.id ?? null,
      requestPath: proxyUrl ? '/sessions' : null,
    });

    if (sessionError || !session) {
      throw new Error('Unauthorized: No active session');
    }

    if (proxyUrl) {
      const url = new URL(`${proxyUrl}/sessions`);
      if (status) url.searchParams.set('status', status);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[liveChat] sessions fetch failed', {
          status: response.status,
          statusText: response.statusText,
          responsePreview: errorText.slice(0, 250),
        });
        throw new Error(`Failed to fetch sessions: ${response.status}`);
      }

      const payload = await response.json();
      return Array.isArray(payload) ? (payload as LiveChatSession[]) : (Array.isArray(payload?.data) ? (payload.data as LiveChatSession[]) : []);
    }

    let query = supabase.from('live_chat_sessions').select('*').order('last_activity_at', { ascending: false });
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as LiveChatSession[];
  } catch (err) {
    console.error('[liveChat] fetchAllLiveChatSessions error', {
      message: err instanceof Error ? err.message : 'Unknown error',
      status: status ?? null,
    });
    throw err;
  }
}

export async function assignAgentToSession(sessionId: string, agentId: string) {
  const { data, error } = await supabase
    .from('live_chat_sessions')
    .update({ assigned_agent_id: agentId, status: 'active', updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .select('*')
    .maybeSingle();

  if (error || !data) throw new Error(error?.message ?? 'Failed to assign agent');
  return data as LiveChatSession;
}

export async function closeLiveChatSession(sessionId: string) {
  const { data, error } = await supabase
    .from('live_chat_sessions')
    .update({ status: 'closed', updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .select('*')
    .maybeSingle();

  if (error || !data) throw new Error(error?.message ?? 'Failed to close session');
  return data as LiveChatSession;
}

export async function deleteLiveChatSession(sessionId: string) {
  const { error } = await supabase.from('live_chat_sessions').delete().eq('id', sessionId);
  if (error) throw new Error(error.message ?? 'Failed to delete live chat session');
}

export async function deleteAllClosedChatSessions() {
  const { error } = await supabase.from('live_chat_sessions').delete().eq('status', 'closed');
  if (error) throw new Error(error.message ?? 'Failed to delete closed chat sessions');
}

export async function fetchLiveChatFeedback(sessionId: string) {
  try {
    // Use the edge function proxy to bypass RLS policy issues
    const proxyUrl = import.meta.env.VITE_LIVE_CHAT_PROXY_URL;
    const url = new URL(`${proxyUrl}/session/feedback`);
    url.searchParams.set('session_id', sessionId);

    // Get current auth session and include token in Authorization header
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('[liveChat] No auth session for feedback fetch:', sessionError);
      return null;
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      console.error('[liveChat] feedback fetch failed with status:', response.status);
      return null;
    }

    const data = await response.json();
    return data as LiveChatFeedback | null;
  } catch (err) {
    console.error('[liveChat] feedback fetch error:', err);
    return null;
  }
}

export interface FeedbackListFilters {
  rating?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface FeedbackListResponse {
  data: LiveChatFeedbackWithSession[];
  total: number;
  count: number;
  offset: number;
  limit: number;
}

export async function fetchAllLiveChatFeedback(filters: FeedbackListFilters = {}): Promise<FeedbackListResponse> {
  try {
    const proxyUrl = import.meta.env.VITE_LIVE_CHAT_PROXY_URL;
    const url = new URL(`${proxyUrl}/all-feedback`);

    // Add query parameters
    if (filters.rating && filters.rating >= 1 && filters.rating <= 5) {
      url.searchParams.set('rating', String(filters.rating));
    }
    if (filters.search) {
      url.searchParams.set('search', filters.search);
    }
    if (filters.startDate) {
      url.searchParams.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      url.searchParams.set('endDate', filters.endDate);
    }
    if (filters.limit) {
      url.searchParams.set('limit', String(Math.min(filters.limit, 1000)));
    }
    if (filters.offset) {
      url.searchParams.set('offset', String(filters.offset));
    }

    // Get current auth session and include token in Authorization header
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('[liveChat] No auth session for feedback fetch:', sessionError);
      throw new Error('Unauthorized: No active session');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      console.error('[liveChat] all-feedback fetch failed with status:', response.status);
      throw new Error(`Failed to fetch feedback: ${response.status}`);
    }

    const data = await response.json();
    return data as FeedbackListResponse;
  } catch (err) {
    console.error('[liveChat] all-feedback fetch error:', err);
    throw err;
  }
}

export async function sendAgentMessage(sessionId: string, agentId: string, agentName: string, content: string) {
  console.info('[admin-live-chat-send] start', {
    sessionId,
    path: '/live_chat_messages',
    author: 'agent',
    contentLength: content.length,
  });

  const payload = { session_id: sessionId, author: 'agent' as const, content, metadata: { agent_id: agentId, agent_name: agentName } };
  const { data, error } = await supabase.from('live_chat_messages').insert(payload).select('*').maybeSingle();
  if (error || !data) {
    console.warn('[admin-live-chat-send] failed', {
      sessionId,
      path: '/live_chat_messages',
      success: false,
      reason: error?.message ?? 'Failed to send agent message',
    });
    throw new Error(error?.message ?? 'Failed to send agent message');
  }

  console.info('[admin-live-chat-send] success', {
    sessionId,
    path: '/live_chat_messages',
    success: true,
    messageId: data.id,
    author: data.author,
    sessionIdFromResponse: data.session_id,
  });

  await supabase.from('live_chat_sessions').update({ last_activity_at: new Date().toISOString() }).eq('id', sessionId);
  return data as LiveChatMessage;
}

export async function subscribeToLiveChatMessages(
  sessionId: string,
  callback: (message: LiveChatMessage) => void
) {
  const channel = supabase
    .channel(`live_chat_messages:${sessionId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_chat_messages', filter: `session_id=eq.${sessionId}` }, (payload) => {
      if (payload.new) {
        callback(payload.new as LiveChatMessage);
      }
    })
    .subscribe();

  return channel;
}

export async function subscribeToLiveChatSession(
  sessionId: string,
  callback: (session: LiveChatSession) => void
) {
  const channel = supabase
    .channel(`live_chat_sessions:${sessionId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_chat_sessions', filter: `id=eq.${sessionId}` }, (payload) => {
      if (payload.new) {
        callback(payload.new as LiveChatSession);
      }
    })
    .subscribe();

  return channel;
}
