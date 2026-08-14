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

export interface LiveChatMessage {
  id: string;
  session_id: string;
  created_at: string | null;
  author: 'visitor' | 'assistant' | 'agent' | 'system';
  content: string;
  metadata: Record<string, unknown> | null;
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
  let query = supabase.from('live_chat_sessions').select('*').order('last_activity_at', { ascending: false });
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as LiveChatSession[];
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
