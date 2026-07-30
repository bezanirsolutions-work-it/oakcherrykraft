const MEMORY_TTL_MS = 10 * 60 * 1000;
const memoryCache = new Map<string, { value: unknown; expiresAt: number }>();
const inFlightRequests = new Map<string, Promise<unknown>>();

const isBrowser = typeof window !== 'undefined';

function readStorageCache<T>(key: string): { value: T; expiresAt: number } | null {
  if (!isBrowser) return null;

  try {
    const rawValue = window.sessionStorage.getItem(key);
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue) as { value: T; expiresAt: number };
    if (!parsed || typeof parsed.expiresAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStorageCache<T>(key: string, value: T, expiresAt: number) {
  if (!isBrowser) return;

  try {
    window.sessionStorage.setItem(key, JSON.stringify({ value, expiresAt }));
  } catch {
    // Ignore storage failures and fall back to in-memory caching only.
  }
}

export async function getCachedData<T>(key: string, ttlMs = MEMORY_TTL_MS, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const memoryEntry = memoryCache.get(key);
  if (memoryEntry && memoryEntry.expiresAt > now) {
    return memoryEntry.value as T;
  }

  const storageEntry = readStorageCache<T>(key);
  if (storageEntry && storageEntry.expiresAt > now) {
    memoryCache.set(key, storageEntry);
    return storageEntry.value;
  }

  const inFlight = inFlightRequests.get(key);
  if (inFlight) {
    return inFlight as Promise<T>;
  }

  const pending = (async () => {
    const value = await fetcher();
    const expiresAt = Date.now() + ttlMs;
    memoryCache.set(key, { value, expiresAt });
    writeStorageCache(key, value, expiresAt);
    return value;
  })();

  inFlightRequests.set(key, pending as Promise<unknown>);

  try {
    return await pending;
  } finally {
    inFlightRequests.delete(key);
  }
}
