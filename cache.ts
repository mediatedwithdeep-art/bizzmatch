/**
 * In-memory TTL cache for hot reads (analytics, discover candidates).
 * Interface is deliberately Redis-shaped: swap the implementation for
 * ioredis when running multiple instances.
 */
const store = new Map<string, { value: unknown; expires: number }>();

export function cacheGet<T>(key: string): T | undefined {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expires) {
    store.delete(key);
    return undefined;
  }
  return hit.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  if (store.size > 5_000) {
    const now = Date.now();
    for (const [k, v] of store) if (v.expires < now) store.delete(k);
  }
  store.set(key, { value, expires: Date.now() + ttlMs });
}

export function cacheDelete(prefix: string): void {
  for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);
}
