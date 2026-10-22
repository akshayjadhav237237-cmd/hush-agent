import React, { useState, useEffect } from 'react';
import { GITHUB_URL } from '@/data/brand';
import { Menu, X } from 'lucide-react';

interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly id: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Replay', href: '#simulator', id: 'simulator' },
  { label: 'Run', href: '#run-it-yourself', id: 'run-it-yourself' },
  { label: 'Architecture', href: '#architecture', id: 'architecture' },
  { label: 'Switching', href: '#account-switching', id: 'account-switching' },
  { label: 'Gates', href: '#gates', id: 'gates' },
  { label: 'Safety', href: '#safety', id: 'safety' },
  { label: 'FAQ', href: '#faq', id: 'faq' },
];

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  const isGithubAvailable =
    (GITHUB_URL as string) !== 'TODO' &&
    (GITHUB_URL as string).trim().length > 0;

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY < 100) {
        setActiveSection('');
        return;
      }

      for (let i = NAV_ITEMS.length - 1; i >= 0; i--) {
        const item = NAV_ITEMS[i];
        const el = document.getElementById(item.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200) {
            setActiveSection(item.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Archivo:wght@800;900&family=Cormorant+Garamond:ital,wght@1,400;1,600&family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
      />

      <header className="fixed top-4 inset-x-0 z-50 flex flex-col items-center pointer-events-none px-4">
        {/* Floating pill navigation */}
        <div className="pointer-events-auto bg-black/90 backdrop-blur-md rounded-[999px] border border-white/[0.08] shadow-2xl py-3 px-6 sm:py-3.5 sm:px-8 max-w-fit mx-auto flex items-center gap-6 md:gap-8 lg:gap-10 transition-all duration-200">
          {/* Mini wordmark HUSH* */}
          <a
            href="#hero"
            aria-label="Hush Home"
            className="flex items-center text-xs sm:text-sm font-bold tracking-wider text-[#F5F0E8] hover:text-[#22FF6E] transition-colors shrink-0 select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22FF6E] rounded"
            style={{ fontFamily: "'JetBrains Mono', var(--font-mono), monospace" }}
          >
            <span>HUSH</span>
            <span className="text-[#22FF6E] text-sm leading-none ml-0.5 font-bold" aria-hidden="true">
              *
            </span>
          </a>

          {/* Desktop nav links */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6 lg:gap-8 xl:gap-10">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`text-xs font-mono uppercase tracking-wider transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22FF6E] rounded py-0.5 ${
                    isActive
                      ? 'text-[#22FF6E]'
                      : 'text-[#F5F0E8] hover:text-[#22FF6E]'
                  }`}
                  style={{ fontFamily: "'JetBrains Mono', var(--font-mono), monospace" }}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Optional GitHub pill indicator (desktop) */}
          {isGithubAvailable && (
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
              className="hidden md:inline-flex items-center text-xs font-mono uppercase tracking-wider text-[#F5F0E8]/60 hover:text-[#22FF6E] transition-colors whitespace-nowrap pl-2 border-l border-white/[0.08]"
              style={{ fontFamily: "'JetBrains Mono', var(--font-mono), monospace" }}
            >
              GitHub
            </a>
          )}

          {/* Mobile hamburger toggle button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden flex items-center justify-center p-1 text-[#F5F0E8] hover:text-[#22FF6E] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22FF6E] rounded"
          >
            {mobileMenuOpen ? (
              <X strokeWidth={1.75} className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Menu strokeWidth={1.75} className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile dropdown panel */}
        {mobileMenuOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="pointer-events-auto mt-2 w-[calc(100vw-2rem)] max-w-xs bg-[#141414]/95 backdrop-blur-md rounded-[24px] border border-white/[0.08] shadow-2xl p-4 flex flex-col gap-1 md:hidden"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors ${
                    isActive
                      ? 'text-[#22FF6E] bg-white/[0.04]'
                      : 'text-[#F5F0E8] hover:text-[#22FF6E] hover:bg-white/[0.04]'
                  }`}
                  style={{ fontFamily: "'JetBrains Mono', var(--font-mono), monospace" }}
                >
                  {item.label}
                </a>
              );
            })}

            {isGithubAvailable && (
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 pt-2.5 border-t border-white/[0.06] px-3 py-2 text-xs font-mono uppercase tracking-wider text-[#F5F0E8]/60 hover:text-[#22FF6E] flex items-center justify-between"
                style={{ fontFamily: "'JetBrains Mono', var(--font-mono), monospace" }}
              >
                <span>GitHub</span>
                <span aria-hidden="true">↗</span>
              </a>
            )}
          </nav>
        )}
      </header>
    </>
  );
};

export default Header;
