import { useCallback, useEffect, useRef, useState } from "react";

/** Initial attempt + retries. */
const MAX_ATTEMPTS = 3;
/** HTTP statuses that are never retried (auth/permission problems). */
const NON_RETRYABLE_STATUS = new Set([401, 403]);

/**
 * Module-level cache shared by every mounted Combobox: two fields using the same
 * `remote.identifier` read each other's options without a second request.
 * Runtime is untyped on purpose (generic stores across instances); the single
 * cast lives at the read site below.
 */
const remoteCache = new Map<string, unknown[]>();

/**
 * HTTP-ish status detection: supports `{ status }` and axios-like `{ response: { status } }` errors.
 * Lets retry logic skip auth/permission failures without depending on any HTTP client.
 */
function getErrorStatusCode(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  const status = (error as { status?: unknown }).status;
  if (typeof status === "number") return status;
  const response = (error as { response?: { status?: unknown } }).response;
  if (response && typeof response === "object") {
    const responseStatus = (response as { status?: unknown }).status;
    if (typeof responseStatus === "number") return responseStatus;
  }
  return null;
}

/**
 * The one remote-loading engine used by both Combobox variants.
 *
 * Semantics:
 * - fetch runs whenever `enabled` turns true (caller maps "dropdown open" to it);
 * - cache-first: `cacheKey` present in the global cache wins over a request,
 *   unless `refreshOnOpen` forces a revalidation;
 * - in-flight requests are superseded: starting a new fetch (or changing the
 *   cache key) aborts the previous one, and a superseded request never writes
 *   state or cache — stale results can never leak into the new key;
 * - errors clear the cache for the key so the next enable retries; transient
 *   failures retry up to MAX_ATTEMPTS, auth/permission statuses never retry.
 */
export function useRemoteItems<T>(
  fetch: ((signal: AbortSignal) => Promise<T[]>) | undefined,
  cacheKey: string | null,
  options?: { enabled?: boolean; refreshOnOpen?: boolean },
): { items: T[]; error: unknown | null; isLoading: boolean } {
  const { enabled = false, refreshOnOpen = false } = options ?? {};

  // Latest fetch closure without needing it in effect deps.
  const fetchRef = useRef(fetch);
  fetchRef.current = fetch;

  const [state, setState] = useState<{
    items: T[];
    error: unknown | null;
    fetching: boolean;
  }>({ items: [], error: null, fetching: false });
  const abortRef = useRef<AbortController | null>(null);

  const runFetch = useCallback(async (key: string, force: boolean) => {
    const doFetch = fetchRef.current;
    if (!doFetch) return;
    if (!force && remoteCache.has(key)) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ items: [], error: null, fetching: true });

    for (let attempt = 0; ; attempt++) {
      try {
        const items = await doFetch(controller.signal);
        if (controller.signal.aborted) return; // superseded: never write stale data
        remoteCache.set(key, items);
        setState({ items, error: null, fetching: false });
        return;
      } catch (error) {
        if (controller.signal.aborted) return; // superseded: never write stale errors
        const status = getErrorStatusCode(error);
        if (attempt < MAX_ATTEMPTS - 1 && !NON_RETRYABLE_STATUS.has(status ?? -1)) continue;
        remoteCache.delete(key);
        setState({ items: [], error, fetching: false });
        return;
      }
    }
  }, []);

  // When the cache key changes (new remote or new search text), abandon any
  // in-flight request for the previous key and surface the fresh key's data.
  useEffect(() => {
    abortRef.current?.abort();
    if (!cacheKey) return;
    const cached = remoteCache.get(cacheKey);
    setState({ items: (cached ?? []) as T[], error: null, fetching: false });
  }, [cacheKey]);

  useEffect(() => {
    if (!enabled || !cacheKey) return;
    void runFetch(cacheKey, refreshOnOpen);
  }, [cacheKey, enabled, refreshOnOpen, runFetch]);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { items: state.items, error: state.error, isLoading: state.fetching };
}
