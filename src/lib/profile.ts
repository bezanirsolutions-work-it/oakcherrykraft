import { supabase } from './supabase';

const getProfileRow = async <T extends Record<string, unknown>>(userId: string, select: string) => {
  const attempts = [
    { column: 'user_id', select },
    { column: 'id', select },
  ];

  let lastError: Error | null = null;

  for (const attempt of attempts) {
    const { data, error } = await supabase
      .from('profiles')
      .select(select)
      .eq(attempt.column, userId)
      .maybeSingle();

    if (!error) {
      return { data: data as T | null, error: null };
    }

    const message = error.message ?? '';
    const isMissingColumnError = error.code === '42703' || /does not exist/i.test(message);

    if (isMissingColumnError) {
      lastError = error as Error;
      continue;
    }

    return { data: null, error: error as Error };
  }

  return { data: null, error: lastError };
};

export const getProfileRole = async (userId: string): Promise<string | null> => {
  const { data, error } = await getProfileRow<{ role?: string | null }>(userId, 'role');
  if (error) throw error;
  return data?.role ?? null;
};

export const getProfileName = async (userId: string): Promise<string | null> => {
  const { data, error } = await getProfileRow<{ full_name?: string | null }>(userId, 'full_name');
  if (error) throw error;
  return data?.full_name ?? null;
};
