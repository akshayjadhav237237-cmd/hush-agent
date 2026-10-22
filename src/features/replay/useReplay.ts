import { useState, useEffect, useRef, useCallback } from 'react';
import type { ReplayPayload, ReplayEvent, ReplayStatus } from './types';

const AUTO_ADVANCE_MS = 1500;

export function useReplay() {
  const [status, setStatus] = useState<ReplayStatus>('loading');
  const [payload, setPayload] = useState<ReplayPayload | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  const fetchReplay = useCallback(async () => {
    setStatus('loading');
    setIsPlaying(false);
    setCurrentIndex(0);

    const baseUrl = import.meta.env.BASE_URL || '/';
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const candidates = [
      `${normalizedBase}replay.json`,
      '/replay.json',
      './replay.json',
    ];

    let foundPayload: ReplayPayload | null = null;

    for (const url of candidates) {
      try {
        const res = await fetch(url, {
          headers: {
            Accept: 'application/json',
          },
          cache: 'no-cache',
        });

        if (!res.ok) {
          continue;
        }

        const text = await res.text();
        const trimmed = text.trim();
        // Guard against HTML fallback returned by dev server / SPA routes
        if (!trimmed || trimmed.startsWith('<')) {
          continue;
        }

        const data = JSON.parse(trimmed);
        if (data && typeof data === 'object' && Array.isArray(data.events) && data.events.length > 0) {
          const parsedEvents: ReplayEvent[] = data.events.map((raw: unknown, idx: number) => {
            const item = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
            const t = typeof item.t === 'number' ? item.t : Number(item.t) || 0;
            const step = typeof item.step === 'number' ? item.step : Number(item.step) || idx + 1;
            const event = typeof item.event === 'string' ? item.event : 'unknown';
            const tool = typeof item.tool === 'string' ? item.tool : undefined;
            const gate = typeof item.gate === 'string' ? item.gate : undefined;
            const summary = typeof item.summary === 'string' ? item.summary : `Event: ${event}`;

            return {
              t,
              step,
              event,
              tool,
              gate,
              summary,
            };
          });

          foundPayload = {
            mode: typeof data.mode === 'string' ? data.mode : undefined,
            run_id: typeof data.run_id === 'string' ? data.run_id : undefined,
            chain_verified: data.chain_verified === true || data.verified === true,
            events: parsedEvents,
          };
          break;
        }
      } catch {
        // Try next candidate URL
      }
    }

    if (foundPayload) {
      setPayload(foundPayload);
      setStatus('available');
      setCurrentIndex(0);
    } else {
      setPayload(null);
      setStatus('not_available');
    }
  }, []);

  useEffect(() => {
    fetchReplay();
  }, [fetchReplay]);

  const totalSteps = payload?.events.length ?? 0;

  // Auto-advance playback timer
  useEffect(() => {
    if (!isPlaying || totalSteps === 0) {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = window.setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= totalSteps - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, AUTO_ADVANCE_MS);

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, totalSteps]);

  const play = useCallback(() => {
    if (totalSteps === 0) return;
    setCurrentIndex((prev) => {
      if (prev >= totalSteps - 1) {
        return 0;
      }
      return prev;
    });
    setIsPlaying(true);
  }, [totalSteps]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  const stepNext = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex((prev) => Math.min(prev + 1, Math.max(0, totalSteps - 1)));
  }, [totalSteps]);

  const stepPrev = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(0);
  }, []);

  const jumpTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalSteps) {
        setCurrentIndex(index);
      }
    },
    [totalSteps]
  );

  const currentEvent = payload?.events[currentIndex] ?? null;

  return {
    status,
    payload,
    events: payload?.events ?? [],
    currentIndex,
    currentEvent,
    totalSteps,
    isPlaying,
    play,
    pause,
    togglePlay,
    stepNext,
    stepPrev,
    reset,
    jumpTo,
    refetch: fetchReplay,
  };
}
