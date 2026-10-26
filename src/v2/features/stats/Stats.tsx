import React, { useState, useEffect, useRef } from 'react';
import { Container } from '@/v2/ui/Container';
import { stats } from '@/v2/data/adapters';
import { useReducedMotion } from '@/v2/ui/useReducedMotion';

interface AnimatedNumberProps {
  target: number;
  suffix?: string;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ target, suffix }) => {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const [hasAnimated, setHasAnimated] = useState<boolean>(false);
  const ref = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<number | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setDisplayValue(target);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 1200; // ms
          const startTime = performance.now();

          const step = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(ease * target);
            setDisplayValue(current);

            if (progress < 1) {
              frameRef.current = requestAnimationFrame(step);
            } else {
              setDisplayValue(target);
            }
          };

          frameRef.current = requestAnimationFrame(step);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [target, hasAnimated, reducedMotion]);

  return (
    <span
      ref={ref}
      className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl text-[var(--v2-headline)] tracking-tight"
    >
      {/* Screen-reader accessible final value always in DOM */}
      <span className="sr-only">
        {target}
        {suffix ?? ''}
      </span>
      <span aria-hidden="true">
        {reducedMotion ? target : displayValue}
        {suffix ?? ''}
      </span>
    </span>
  );
};

export const Stats: React.FC = () => {
  const items = stats();

  return (
    <div className="w-full py-16 sm:py-24 border-y border-[var(--v2-line)] bg-[var(--v2-card)]/30">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--v2-line)] items-center">
          {items.map((stat) => (
            <div
              key={stat.id}
              className="flex flex-col items-center justify-center text-center p-8 sm:p-10"
            >
              <div className="mb-3">
                <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              </div>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--v2-muted)]">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
};
