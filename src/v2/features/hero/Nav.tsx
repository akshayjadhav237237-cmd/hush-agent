import React, { useState, useEffect, useRef } from 'react';
import { COPY_V2 } from '@/v2/data/copy.v2';
import { Menu, X, ArrowUpRight } from 'lucide-react';

export const Nav: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  // Active section tracking via IntersectionObserver
  useEffect(() => {
    const sectionIds = ['how', 'gates', 'replay', 'faq'];
    const visibilityMap: Record<string, number> = {};

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibilityMap[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
        });

        // Clear active section if at top of page (hero / manifesto)
        if (window.scrollY < 300) {
          setActiveSection('');
          return;
        }

        let bestId = '';
        let maxRatio = 0;
        for (const [id, ratio] of Object.entries(visibilityMap)) {
          if (ratio > maxRatio) {
            maxRatio = ratio;
            bestId = id;
          }
        }

        if (bestId && maxRatio > 0) {
          setActiveSection(bestId);
        }
      },
      {
        rootMargin: '-15% 0px -40% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    const handleScroll = () => {
      if (window.scrollY < 300) {
        setActiveSection('');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Accessible Dialog: Lock body scroll & trap focus when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Auto-focus close button when dialog opens
      const focusTimer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setMobileMenuOpen(false);
          triggerButtonRef.current?.focus();
        }

        // Focus trap
        if (e.key === 'Tab' && dialogRef.current) {
          const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;

          const firstEl = focusable[0];
          const lastEl = focusable[focusable.length - 1];

          if (e.shiftKey && document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          } else if (!e.shiftKey && document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        clearTimeout(focusTimer);
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [mobileMenuOpen]);

  const handleCloseMenu = () => {
    setMobileMenuOpen(false);
    triggerButtonRef.current?.focus();
  };

  return (
    <>
      {/* Floating Black Pill Nav at top 18px with hairline border */}
      <nav
        aria-label="Main Navigation"
        className="fixed top-[18px] left-1/2 -translate-x-1/2 z-50 flex items-center justify-between sm:justify-center px-4 py-2 sm:px-6 sm:py-2.5 rounded-full bg-[var(--v2-bg)]/90 backdrop-blur-md border border-[var(--v2-line)] shadow-lg shadow-black/40 max-w-[calc(100vw-24px)] sm:max-w-max"
      >
        {/* Mobile brand mark */}
        <a
          href="#hero"
          aria-label="Hush Home"
          className="sm:hidden font-display font-extrabold text-[var(--v2-text)] tracking-tight text-sm mr-4 flex items-center gap-1 select-none focus-visible:outline-2 focus-visible:outline-[var(--v2-accent)] rounded-sm"
        >
          HUSH
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--v2-accent)]" aria-hidden="true" />
        </a>

        {/* Desktop Links with Active Section Highlight */}
        <div className="hidden sm:flex items-center gap-1 sm:gap-2">
          {COPY_V2.nav.map((item) => {
            const isAnchor = item.href.startsWith('#');
            const targetId = isAnchor ? item.href.slice(1) : '';
            const isActive = isAnchor && activeSection === targetId;

            return (
              <a
                key={item.label}
                href={item.href}
                aria-current={isActive ? 'true' : undefined}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                className={`relative px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-[var(--v2-headline)] bg-white/[0.08]'
                    : 'text-[var(--v2-muted)] hover:text-[var(--v2-text)] hover:bg-white/[0.04]'
                }`}
              >
                <span className="flex items-center gap-1">
                  {item.label}
                  {item.external && (
                    <ArrowUpRight className="w-3 h-3 opacity-60" aria-hidden="true" />
                  )}
                </span>
                {isActive && (
                  <span
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--v2-accent)]"
                    aria-hidden="true"
                  />
                )}
              </a>
            );
          })}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          ref={triggerButtonRef}
          onClick={() => setMobileMenuOpen(true)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav-dialog"
          aria-haspopup="dialog"
          aria-label="Open navigation menu"
          className="sm:hidden p-1.5 text-[var(--v2-text)]/80 hover:text-white rounded-full focus-visible:outline-2 focus-visible:outline-[var(--v2-accent)] transition-colors"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>
      </nav>

      {/* Accessible Mobile Menu Dialog */}
      {mobileMenuOpen && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site Navigation"
          id="mobile-nav-dialog"
          className="fixed inset-0 z-50 sm:hidden bg-black/95 backdrop-blur-xl flex flex-col justify-between p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--v2-line)] pb-4">
            <div className="flex items-center gap-1.5 font-display font-extrabold text-lg text-[var(--v2-text)]">
              HUSH
              <span className="w-2 h-2 rounded-full bg-[var(--v2-accent)]" aria-hidden="true" />
            </div>
            <button
              type="button"
              ref={closeButtonRef}
              onClick={handleCloseMenu}
              aria-label="Close navigation menu"
              className="p-2 text-[var(--v2-text)] hover:text-white rounded-full bg-white/[0.06] border border-[var(--v2-line)] focus-visible:outline-2 focus-visible:outline-[var(--v2-accent)] transition-colors"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Links */}
          <nav aria-label="Mobile Navigation Links" className="flex flex-col gap-2 py-6">
            {COPY_V2.nav.map((item, idx) => {
              const isAnchor = item.href.startsWith('#');
              const targetId = isAnchor ? item.href.slice(1) : '';
              const isActive = isAnchor && activeSection === targetId;

              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={handleCloseMenu}
                  aria-current={isActive ? 'true' : undefined}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  className={`text-xl font-medium flex items-center justify-between py-3 border-b border-[var(--v2-line)]/50 transition-colors ${
                    isActive
                      ? 'text-[var(--v2-headline)] font-semibold'
                      : 'text-[var(--v2-text)] hover:text-[var(--v2-accent)]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isActive && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-[var(--v2-accent)]"
                        aria-hidden="true"
                      />
                    )}
                    {item.label}
                  </span>
                  {item.external ? (
                    <ArrowUpRight className="w-5 h-5 opacity-60" aria-hidden="true" />
                  ) : (
                    <span className="text-xs font-mono text-[var(--v2-muted)]">0{idx + 1}</span>
                  )}
                </a>
              );
            })}
          </nav>

          {/* Tagline footer */}
          <div className="text-xs font-mono text-[var(--v2-muted)] pt-4 border-t border-[var(--v2-line)]">
            {COPY_V2.hero.tagline}
          </div>
        </div>
      )}
    </>
  );
};
