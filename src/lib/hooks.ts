import { useCallback, useEffect, useRef, useState } from "react";
import { WidgetError, type DiscordStatus } from "./api";

export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export type Polled<T> = {
  data: T | null;
  error: WidgetError | null;
  loading: boolean;
  refresh: () => void;
};

/**
 * Polls a real API on an interval, keyed by `key`. Previous data stays on screen
 * while a refresh is in flight so widgets never flash empty.
 */
export function usePolled<T>(
  enabled: boolean,
  key: string,
  fetcher: (signal: AbortSignal) => Promise<T>,
  intervalMs: number,
): Polled<T> {
  const [state, setState] = useState<{ data: T | null; error: WidgetError | null; loading: boolean }>({
    data: null,
    error: null,
    loading: enabled,
  });
  const [nonce, setNonce] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const keyRef = useRef<string | null>(null);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  // A different account/guild means the old payload is no longer the same widget:
  // drop it so a failure can never display data from the previous target.
  useEffect(() => {
    if (keyRef.current === key) return;
    keyRef.current = key;
    setState({ data: null, error: null, loading: enabled });
  }, [key, enabled]);

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, error: null, loading: false });
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    setState((prev) => ({ ...prev, loading: prev.data === null }));

    const run = async () => {
      try {
        const data = await fetcherRef.current(controller.signal);
        if (cancelled) return;
        setState({ data, error: null, loading: false });
      } catch (error) {
        if (cancelled || controller.signal.aborted) return;
        const widgetError =
          error instanceof WidgetError
            ? error
            : new WidgetError("network", error instanceof Error ? error.message : "Unknown error");
        setState((prev) => ({ data: prev.data, error: widgetError, loading: false }));
      }
    };

    void run();
    const id = window.setInterval(run, intervalMs);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(id);
    };
  }, [enabled, key, intervalMs, nonce]);

  return { ...state, refresh };
}

export const STATUS_COLORS: Record<DiscordStatus, string> = {
  online: "#23a55a",
  idle: "#f0b232",
  dnd: "#f23f43",
  offline: "#80848e",
};

export const STATUS_LABELS: Record<DiscordStatus, string> = {
  online: "Online",
  idle: "Idle",
  dnd: "Do not disturb",
  offline: "Offline",
};
