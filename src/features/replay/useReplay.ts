import { useState, useEffect, useRef, useCallback } from 'react';
import type { ReplayPayload, ReplayEvent, ReplayStatus, PlaybackSpeed } from './types';
import { sanitizeReplayText } from './sanitizer';

const BASE_AUTO_ADVANCE_MS = 1500;

export function isGateLikeEvent(event: ReplayEvent | null | undefined): boolean {
  if (!event) return false;
  return (
    event.event === 'gate' ||
    event.event === 'limit' ||
    event.event === 'switch' ||
    Boolean(event.gate)
  );
}

export function useReplay() {
  const [status, setStatus] = useState<ReplayStatus>('loading');
  const [payload, setPayload] = useState<ReplayPayload | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
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
          // Detect provider strictly according to:
          // "Show model provider badge ONLY if replay.json carries provider in run_start summary or event data."
          let detectedProvider: string | undefined = undefined;

          // 1. Check if run_start event has provider or summary mentions provider
          const runStartRaw = (data.events as unknown[]).find(
            (e) => typeof e === 'object' && e !== null && (e as Record<string, unknown>).event === 'run_start'
          ) as Record<string, unknown> | undefined;

          if (runStartRaw) {
            if (typeof runStartRaw.provider === 'string' && runStartRaw.provider.trim()) {
              detectedProvider = runStartRaw.provider.trim();
            } else if (typeof runStartRaw.summary === 'string') {
              const match = runStartRaw.summary.match(/\bprovider[:=\s]+([a-zA-Z0-9_\-]+)/i);
              if (match && match[1]) {
                detectedProvider = match[1];
              }
            }
          }

          // 2. Check if any event has provider field
          if (!detectedProvider) {
            for (const raw of data.events as unknown[]) {
              if (typeof raw === 'object' && raw !== null) {
                const p = (raw as Record<string, unknown>).provider;
                if (typeof p === 'string' && p.trim()) {
                  detectedProvider = p.trim();
                  break;
                }
              }
            }
          }

          // 3. Check top-level data.provider if present
          if (!detectedProvider && typeof data.provider === 'string' && data.provider.trim()) {
            detectedProvider = data.provider.trim();
          }

          const parsedEvents: ReplayEvent[] = data.events.map((raw: unknown, idx: number) => {
            const item = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
            const t = typeof item.t === 'number' ? item.t : Number(item.t) || 0;
            const step = typeof item.step === 'number' ? item.step : Number(item.step) || idx + 1;
            const event = typeof item.event === 'string' ? item.event : 'unknown';
            const tool = typeof item.tool === 'string' ? item.tool : undefined;
            const gate = typeof item.gate === 'string' ? item.gate : undefined;
            const rawSummary = typeof item.summary === 'string' ? item.summary : `Event: ${event}`;
            const summary = sanitizeReplayText(rawSummary);
            const provider = typeof item.provider === 'string' && item.provider.trim() ? item.provider.trim() : undefined;

            return {
              t,
              step,
              event,
              tool,
              gate,
              provider,
              summary,
            };
          });

          foundPayload = {
            mode: typeof data.mode === 'string' ? data.mode : undefined,
            run_id: typeof data.run_id === 'string' ? data.run_id : undefined,
            chain_verified: data.chain_verified === true || data.verified === true,
            provider: detectedProvider,
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

  // Auto-advance playback timer with speed adjustment
  useEffect(() => {
    if (!isPlaying || totalSteps === 0) {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const intervalMs = Math.round(BASE_AUTO_ADVANCE_MS / speed);

    timerRef.current = window.setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= totalSteps - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, totalSteps, speed]);

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

  const stepToNextGate = useCallback(() => {
    if (totalSteps === 0) return;
    for (let i = currentIndex + 1; i < totalSteps; i++) {
      const ev = payload?.events[i];
      if (ev && isGateLikeEvent(ev)) {
        setIsPlaying(false);
        setCurrentIndex(i);
        return;
      }
    }
  }, [currentIndex, totalSteps, payload]);

  const hasNextGate = Boolean(
    payload?.events.slice(currentIndex + 1).some((ev) => isGateLikeEvent(ev))
  );

  const cycleSpeed = useCallback(() => {
    setSpeed((curr) => {
      if (curr === 1) return 2;
      if (curr === 2) return 4;
      return 1;
    });
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
    speed,
    setSpeed,
    cycleSpeed,
    play,
    pause,
    togglePlay,
    stepNext,
    stepPrev,
    stepToNextGate,
    hasNextGate,
    reset,
    jumpTo,
    refetch: fetchReplay,
  };
}
