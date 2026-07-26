import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string | null;
  status: 'new' | 'read' | 'replied' | 'closed';
  created_at: string;
  updated_at: string;
}

interface UseContactMessagesReturn {
  messages: ContactMessage[];
  loading: boolean;
  error: string | null;
  fetchMessages: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAsReplied: (id: string) => Promise<void>;
  markAsClosed: (id: string) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  archiveMessage: (id: string) => Promise<void>;
}

export function useContactMessages(): UseContactMessagesReturn {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setMessages((data as ContactMessage[]) || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch messages';
      setError(message);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMessageStatus = useCallback(async (id: string, status: ContactMessage['status']) => {
    try {
      const { error: updateError } = await supabase
        .from('contact_messages')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === id ? { ...msg, status, updated_at: new Date().toISOString() } : msg
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update message';
      setError(message);
      throw err;
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    await updateMessageStatus(id, 'read');
  }, [updateMessageStatus]);

  const markAsReplied = useCallback(async (id: string) => {
    await updateMessageStatus(id, 'replied');
  }, [updateMessageStatus]);

  const markAsClosed = useCallback(async (id: string) => {
    await updateMessageStatus(id, 'closed');
  }, [updateMessageStatus]);

  const deleteMessage = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setMessages((prev) => prev.filter((msg) => msg.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete message';
      setError(message);
      throw err;
    }
  }, []);

  const archiveMessage = useCallback(async (id: string) => {
    await updateMessageStatus(id, 'closed');
  }, [updateMessageStatus]);

  return {
    messages,
    loading,
    error,
    fetchMessages,
    markAsRead,
    markAsReplied,
    markAsClosed,
    deleteMessage,
    archiveMessage,
  };
}
