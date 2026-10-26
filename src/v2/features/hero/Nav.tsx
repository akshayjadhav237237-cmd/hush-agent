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

  // Auto-close mobile drawer on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Accessible Dialog: Lock body scroll & trap focus when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const focusTimer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setMobileMenuOpen(false);
          triggerButtonRef.current?.focus();
        }

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
      {/* Black pill tab attached FLUSH to the top edge of the hero container, centered horizontally */}
      <nav
        aria-label="Main Navigation"
        className="absolute top-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl rounded-t-none rounded-b-[28px] border-x border-b border-white/[0.08] bg-[#0A0A0A]/90 backdrop-blur-md px-6 sm:px-10 py-[18px] flex items-center justify-between"
      >
        {/* Brand / Logo or Mobile title */}
        <a
          href="#hero"
          aria-label="Hush Home"
          className="font-display font-extrabold text-[var(--v2-text)] tracking-tight text-base sm:text-lg flex items-center gap-1.5 select-none focus-visible:outline-2 focus-visible:outline-[var(--v2-accent)] rounded-sm"
        >
          HUSH
          <span className="w-2 h-2 rounded-full bg-[var(--v2-accent)]" aria-hidden="true" />
        </a>

        {/* Desktop Links: 4-5 links with ~56px gap (gap-10 sm:gap-14), regular font weight 400, 16px text-base, cream-grey text */}
        <div className="hidden sm:flex items-center gap-10 sm:gap-14 font-normal text-base">
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
                className={`relative transition-colors ${
                  isActive
                    ? 'text-white font-medium'
                    : 'text-[#CFCFC8] hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {item.label}
                  {item.external && (
                    <ArrowUpRight className="w-4 h-4 opacity-70" aria-hidden="true" />
                  )}
                </span>
                {isActive && (
                  <span
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[var(--v2-accent)]"
                    aria-hidden="true"
                  />
                )}
              </a>
            );
          })}
        </div>

        {/* Mobile Menu Button (<640px collapse to hamburger) */}
        <button
          type="button"
          ref={triggerButtonRef}
          onClick={() => setMobileMenuOpen(true)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav-dialog"
          aria-haspopup="dialog"
          aria-label="Open navigation menu"
          className="sm:hidden p-2 text-[#CFCFC8] hover:text-white rounded-full focus-visible:outline-2 focus-visible:outline-[var(--v2-accent)] transition-colors"
        >
          <Menu className="w-6 h-6" aria-hidden="true" />
        </button>
      </nav>

      {/* Accessible Mobile Menu Drawer */}
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
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-1.5 font-display font-extrabold text-lg text-[var(--v2-text)]">
              HUSH
              <span className="w-2 h-2 rounded-full bg-[var(--v2-accent)]" aria-hidden="true" />
            </div>
            <button
              type="button"
              ref={closeButtonRef}
              onClick={handleCloseMenu}
              aria-label="Close navigation menu"
              className="p-2 text-[var(--v2-text)] hover:text-white rounded-full bg-white/[0.06] border border-white/[0.08] focus-visible:outline-2 focus-visible:outline-[var(--v2-accent)] transition-colors"
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
                  className={`text-xl font-normal flex items-center justify-between py-3 border-b border-white/[0.06] transition-colors ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-[#CFCFC8] hover:text-white'
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
          <div className="text-xs font-mono text-[var(--v2-muted)] pt-4 border-t border-white/[0.08]">
            {COPY_V2.hero.tagline}
          </div>
        </div>
      )}
    </>
  );
};
