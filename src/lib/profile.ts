import { supabase } from './supabase';

const ADMIN_EMAIL_FALLBACKS = [
  'oakcherrykraft@gmail.com',
  import.meta.env.VITE_ADMIN_EMAIL,
].filter((email): email is string => Boolean(email && typeof email === 'string' && email.trim()));

const isKnownAdminEmail = (email?: string | null) => {
  if (!email) return false;
  return ADMIN_EMAIL_FALLBACKS.some((adminEmail) => adminEmail.toLowerCase() === email.toLowerCase());
};

export const getProfileRole = async (userId: string): Promise<string | null> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;

  const sessionRole =
    (session?.user as { user_metadata?: { role?: string }; app_metadata?: { role?: string }; email?: string | null })?.user_metadata?.role
    ?? (session?.user as { user_metadata?: { role?: string }; app_metadata?: { role?: string }; email?: string | null })?.app_metadata?.role;

  if (sessionRole) {
    return sessionRole;
  }

  const sessionEmail = (session?.user as { email?: string | null } | undefined)?.email;
  if (isKnownAdminEmail(sessionEmail)) {
    return 'admin';
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data?.role) {
    const fallbackEmail = (await supabase.auth.getUser()).data.user?.email;
    if (isKnownAdminEmail(fallbackEmail)) {
      return 'admin';
    }
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
