import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useScroll, useMotionValueEvent } from 'motion/react';
import { useReducedMotion } from '@/v2/ui/useReducedMotion';

export interface LineRevealProps {
  text: string;
  className?: string;
}

export const LineReveal: React.FC<LineRevealProps> = ({ text, className = '' }) => {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const linesMapRef = useRef<HTMLSpanElement[][]>([]);
  const reducedMotion = useReducedMotion();
  const [ready, setReady] = useState(false);

  const words = useMemo(() => text.trim().split(/\s+/).filter(Boolean), [text]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.85', 'end 0.35'],
  });

  const updateLineOpacities = (progress: number) => {
    if (reducedMotion) {
      wordsRef.current.forEach((w) => {
        if (w) w.style.opacity = '1';
      });
      return;
    }

    const lines = linesMapRef.current;
    if (lines.length === 0) return;

    const totalLines = lines.length;
    lines.forEach((lineWords, lineIdx) => {
      const start = totalLines > 1 ? (lineIdx / totalLines) * 0.7 : 0;
      const end = Math.min(start + 0.35, 1);
      const clamped = Math.max(0, Math.min(1, (progress - start) / (end - start)));
      const opacity = 0.14 + clamped * 0.86;

      lineWords.forEach((wordEl) => {
        if (wordEl) {
          wordEl.style.opacity = opacity.toFixed(3);
        }
      });
    });
  };

  const measureLines = () => {
    if (!containerRef.current) return;
    const wordEls = wordsRef.current.filter(Boolean) as HTMLSpanElement[];
    if (wordEls.length === 0) return;

    const lines: HTMLSpanElement[][] = [];
    let currentLine: HTMLSpanElement[] = [];
    let currentTop = -1;

    wordEls.forEach((el) => {
      const top = el.offsetTop;
      if (currentTop === -1 || Math.abs(top - currentTop) < 8) {
        currentLine.push(el);
        if (currentTop === -1) currentTop = top;
      } else {
        lines.push(currentLine);
        currentLine = [el];
        currentTop = top;
      }
    });

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    linesMapRef.current = lines;
    updateLineOpacities(scrollYProgress.get());
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;
    let rafId: number | null = null;

    const runMeasure = () => {
      if (!isMounted) return;
      measureLines();
    };

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!isMounted) return;
        runMeasure();
        setReady(true);
      });
    } else {
      runMeasure();
      setReady(true);
    }

    const observer = new ResizeObserver(() => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        runMeasure();
      });
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      isMounted = false;
      if (rafId !== null) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [reducedMotion]);

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    if (ready) {
      updateLineOpacities(latest);
    }
  });

  useEffect(() => {
    if (ready) {
      updateLineOpacities(scrollYProgress.get());
    }
  });

  return (
    <p
      ref={containerRef}
      className={`font-body text-[var(--v2-text)] leading-relaxed ${className}`}
    >
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          ref={(el) => {
            wordsRef.current[i] = el;
          }}
          className={`inline-block ${i < words.length - 1 ? 'mr-[0.28em]' : ''}`}
          style={reducedMotion || !ready ? { opacity: 1 } : undefined}
        >
          {word}
        </span>
      ))}
    </p>
  );
};
