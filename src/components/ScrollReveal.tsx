import React, { useEffect, useRef, useState, useMemo } from 'react';

export interface ScrollRevealProps {
  /** The text content to reveal word-by-word */
  text: string;
  /** Additional CSS classes for the container */
  className?: string;
  /** HTML element tag to render. Defaults to 'p' */
  as?: keyof React.JSX.IntrinsicElements;
  /** Reveal mode: 'observer' (entry cascade) or 'scroll' (scroll-scrubbed). Defaults to 'observer' */
  mode?: 'observer' | 'scroll';
  /** IntersectionObserver threshold (0 to 1). Defaults to 0.15 */
  threshold?: number;
  /** Milliseconds stagger delay between each word. Defaults to 24ms */
  staggerDelay?: number;
  /** Whether the reveal animation only plays once. Defaults to true */
  once?: boolean;
}

/**
 * ScrollReveal wraps text and reveals it word-by-word from opacity 0.2 to 1.0
 * as it enters the viewport. Respects prefers-reduced-motion by rendering
 * static text at opacity 1.0 immediately.
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  text,
  className = '',
  as = 'p',
  mode = 'observer',
  threshold = 0.15,
  staggerDelay = 24,
  once = true,
}) => {
  const containerRef = useRef<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Check and listen for prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // Split text into words while preserving single spacing
  const words = useMemo(() => {
    if (!text) return [];
    return text.trim().split(/\s+/);
  }, [text]);

  // Observer mode: trigger cascade when element enters viewport
  useEffect(() => {
    if (prefersReducedMotion) return;
    if (typeof window === 'undefined') return;

    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once) {
            observer.unobserve(node);
          }
        } else if (!once) {
          setIsInView(false);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [prefersReducedMotion, threshold, once]);

  // Scroll scrub mode: track scroll progress through the viewport
  useEffect(() => {
    if (mode !== 'scroll' || prefersReducedMotion) return;
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      const node = containerRef.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Reveal starts when top of element reaches 85% of viewport height
      // and completes when top reaches 40% of viewport height
      const start = windowHeight * 0.85;
      const end = windowHeight * 0.4;

      const rawProgress = (start - rect.top) / (start - end);
      const clamped = Math.max(0, Math.min(1, rawProgress));
      setScrollProgress(clamped);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [mode, prefersReducedMotion]);

  const Component = as as React.ElementType;

  // If user prefers reduced motion, disable animation completely and render static text at full opacity
  if (prefersReducedMotion) {
    return (
      <Component className={className}>
        {text}
      </Component>
    );
  }

  return (
    <Component
      ref={containerRef as React.Ref<HTMLElement>}
      className={className}
    >
      {/* Screen-reader accessible full text */}
      <span className="sr-only">{text}</span>

      {/* Visual animated word spans with aria-hidden to prevent fragmented reading */}
      <span aria-hidden="true">
        {words.map((word, index) => {
          const isLast = index === words.length - 1;

          let wordOpacity = 0.2;
          let transitionStyle: React.CSSProperties;

          if (mode === 'scroll') {
            const wordThreshold = words.length <= 1 ? 0 : index / (words.length - 1);
            const isRevealed = scrollProgress >= wordThreshold;
            wordOpacity = isRevealed ? 1.0 : 0.2;
            transitionStyle = {
              opacity: wordOpacity,
              transition: 'opacity 250ms ease-out',
            };
          } else {
            wordOpacity = isInView ? 1.0 : 0.2;
            transitionStyle = {
              opacity: wordOpacity,
              transition: 'opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)',
              transitionDelay: isInView ? `${Math.min(index * staggerDelay, 1200)}ms` : '0ms',
            };
          }

          return (
            <React.Fragment key={index}>
              <span
                className="inline-block will-change-[opacity]"
                style={transitionStyle}
              >
                {word}
              </span>
              {!isLast && ' '}
            </React.Fragment>
          );
        })}
      </span>
    </Component>
  );
};

export default ScrollReveal;
