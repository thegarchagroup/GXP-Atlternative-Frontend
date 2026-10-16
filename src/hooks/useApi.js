import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Load data from the API, optionally re-polling while the tab is visible.
 * Background refreshes keep the previous data on screen (no flicker).
 */
export function useApi(fetcher, deps = [], { interval = 0, enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const requestId = useRef(0);

  const load = useCallback(async ({ background = false } = {}) => {
    const id = ++requestId.current;
    if (!background) setLoading(true);
    try {
      const result = await fetcherRef.current();
      if (id === requestId.current) {
        setData(result);
        setError(null);
      }
      return result;
    } catch (err) {
      if (id === requestId.current && !background) setError(err);
      return undefined;
    } finally {
      if (id === requestId.current && !background) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    load();
    if (!interval) return undefined;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') load({ background: true });
    }, interval);
    const onVisible = () => document.visibilityState === 'visible' && load({ background: true });
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, interval]);

  return { data, setData, error, loading, reload: load, refresh: () => load({ background: true }) };
}

/** Wrap an async action with a pending flag. */
export function useAction(fn) {
  const [pending, setPending] = useState(false);
  const run = useCallback(async (...args) => {
    setPending(true);
    try {
      return await fn(...args);
    } finally {
      setPending(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fn]);
  return [run, pending];
}
