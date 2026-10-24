import React, { useEffect, useState, useRef, useCallback } from 'react';

export interface SectionProgressItem {
  /** The anchor ID matching the section DOM id (without '#') */
  readonly id: string;
  /** Visible label displayed in the tooltip */
  readonly label: string;
  /** Optional secondary subtitle or description */
  readonly description?: string;
}

export const DEFAULT_SECTIONS: readonly SectionProgressItem[] = [
  { id: 'hero', label: 'Hero', description: 'Overview' },
  { id: 'simulator', label: 'Replay', description: 'Interactive Simulator' },
  { id: 'run-it-yourself', label: 'Run', description: 'CLI & Run It Yourself' },
  { id: 'architecture', label: 'Architecture', description: 'Dual-Actor Engine' },
  { id: 'account-switching', label: 'Switching', description: 'Account Switching' },
  { id: 'gates', label: 'Gates', description: 'Approval Gates' },
  { id: 'safety', label: 'Safety', description: 'Safety & Guardrails' },
  { id: 'faq', label: 'FAQ', description: 'Frequently Asked Questions' },
];

export interface SectionProgressProps {
  /** Optional custom list of sections. Defaults to DEFAULT_SECTIONS */
  readonly sections?: readonly SectionProgressItem[];
  /** Fixed horizontal edge: 'right' (default) or 'left' */
  readonly position?: 'right' | 'left';
  /** Additional CSS class names for outer navigation container */
  readonly className?: string;
}

/**
 * SectionProgress provides a floating vertical indicator for major page sections.
 * - Highlights the currently active section in the viewport using IntersectionObserver.
 * - Smooth scrolls on click (respecting prefers-reduced-motion).
 * - Responsive: hidden on screens < 1024px (hidden lg:flex).
 * - Minimalist dot/pill design with hover/focus tooltips.
 */
export const SectionProgress: React.FC<SectionProgressProps> = ({
  sections = DEFAULT_SECTIONS,
  position = 'right',
  className = '',
}) => {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? 'hero');
  const rafIdRef = useRef<number | null>(null);

  // Determine which section is currently active based on viewport position
  const evaluateActiveSection = useCallback(() => {
    if (typeof window === 'undefined' || sections.length === 0) return;

    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const scrollHeight = document.documentElement.scrollHeight;

    // 1. If user is at the very top of the page, activate the first section
    if (scrollY < 120) {
      setActiveId(sections[0].id);
      return;
    }

    // 2. If user is scrolled to the bottom of the page, activate the last section
    if (windowHeight + scrollY >= scrollHeight - 80) {
      setActiveId(sections[sections.length - 1].id);
      return;
    }

    // 3. Focal line at 35% of the viewport height (natural reading eye level)
    const focalY = windowHeight * 0.35;
    let matchedId = sections[0].id;
    let minDistance = Infinity;

    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (!el) continue;

      const rect = el.getBoundingClientRect();

      // If the section spans across the focal line, it is the primary active section
      if (rect.top <= focalY && rect.bottom >= focalY) {
        matchedId = section.id;
        break;
      }

      // Otherwise find the section with the top boundary closest to focalY
      const distance = Math.abs(rect.top - focalY);
      if (distance < minDistance) {
        minDistance = distance;
        matchedId = section.id;
      }
    }

    setActiveId(matchedId);
  }, [sections]);

  // Set up IntersectionObserver and scroll listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Throttle evaluation with requestAnimationFrame
    const onScrollOrResize = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = window.requestAnimationFrame(() => {
        evaluateActiveSection();
        rafIdRef.current = null;
      });
    };

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });

    // Initial check
    evaluateActiveSection();

    // Use IntersectionObserver to react to section boundary crossings
    let observer: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        () => {
          onScrollOrResize();
        },
        {
          rootMargin: '-15% 0px -30% 0px',
          threshold: [0, 0.25, 0.5, 0.75, 1.0],
        }
      );

      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          observer.observe(el);
        }
      }
    }

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
      }
      if (observer) {
        observer.disconnect();
      }
    };
  }, [sections, evaluateActiveSection]);

  // Click handler: smooth scroll to section, respecting prefers-reduced-motion
  const handleNavigate = (
    e: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string
  ) => {
    e.preventDefault();
    const target = document.getElementById(sectionId);
    if (!target) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    target.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });

    if (typeof window !== 'undefined' && window.history?.pushState) {
      window.history.pushState(null, '', `#${sectionId}`);
    }
    setActiveId(sectionId);
  };

  const isRight = position === 'right';

  return (
    <nav
      aria-label="Section navigation"
      className={`hidden lg:flex fixed top-1/2 -translate-y-1/2 z-40 select-none ${
        isRight ? 'right-4 xl:right-6' : 'left-4 xl:left-6'
      } ${className}`}
    >
      <div className="flex flex-col items-center gap-2.5 p-2 rounded-full bg-surface/85 backdrop-blur-md border border-border shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-colors">
        {sections.map((item) => {
          const isActive = activeId === item.id;

          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => handleNavigate(e, item.id)}
              aria-label={`Jump to ${item.label} section`}
              aria-current={isActive ? 'location' : undefined}
              className="group relative flex items-center justify-center w-7 h-7 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {/* Tooltip on hover/focus */}
              <div
                role="tooltip"
                className={`absolute top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all duration-200 ease-out z-50 ${
                  isRight
                    ? 'right-full mr-3 translate-x-1 group-hover:translate-x-0 group-focus-visible:translate-x-0'
                    : 'left-full ml-3 -translate-x-1 group-hover:translate-x-0 group-focus-visible:translate-x-0'
                }`}
              >
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-[8px] bg-surface border border-border shadow-md whitespace-nowrap">
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      isActive ? 'bg-accent' : 'bg-text-muted/40'
                    }`}
                    aria-hidden="true"
                  />
                  <span
                    className={`text-xs font-medium transition-colors ${
                      isActive ? 'text-accent font-semibold' : 'text-text'
                    }`}
                  >
                    {item.label}
                  </span>
                  {item.description && (
                    <span className="text-[11px] text-text-muted hidden xl:inline">
                      · {item.description}
                    </span>
                  )}
                </div>
              </div>

              {/* Minimalist dot or active pill */}
              {isActive ? (
                <span
                  className="w-2 h-5 rounded-full bg-accent shadow-[0_0_8px_rgba(43,76,63,0.35)] dark:shadow-[0_0_8px_rgba(127,181,157,0.45)] transition-all duration-300 ease-out"
                  aria-hidden="true"
                />
              ) : (
                <span
                  className="w-2 h-2 rounded-full bg-text-muted/30 group-hover:bg-text group-hover:scale-125 transition-all duration-200 ease-out"
                  aria-hidden="true"
                />
              )}
            </a>
          );
        })}
      </div>
    </nav>
  );
};

export default SectionProgress;
