import { supabase } from './supabase';

export const getProfileRole = async (userId: string): Promise<string | null> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;

  const sessionRole =
    (session?.user as { user_metadata?: { role?: string }; app_metadata?: { role?: string } })?.user_metadata?.role
    ?? (session?.user as { user_metadata?: { role?: string }; app_metadata?: { role?: string } })?.app_metadata?.role;

  if (sessionRole) {
    return sessionRole;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data?.role) {
    return null;
  }

  return data.role;
};

export const getProfileName = async (userId: string): Promise<string | null> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;

  if (!session?.user?.id || session.user.id !== userId) {
    return null;
  }

  const sessionName =
    (session.user as { user_metadata?: { full_name?: string }; app_metadata?: { full_name?: string } }).user_metadata?.full_name
    ?? (session.user as { user_metadata?: { full_name?: string }; app_metadata?: { full_name?: string } }).app_metadata?.full_name;

  if (sessionName) {
    return sessionName;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data?.full_name) {
    return null;
  }

  return data.full_name;
};
