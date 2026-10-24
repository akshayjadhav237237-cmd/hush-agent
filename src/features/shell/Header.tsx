import React, { useState } from 'react';
import { PROJECT_NAME, GITHUB_URL } from '@/data/brand';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Menu, X } from 'lucide-react';

interface NavItem {
  readonly label: string;
  readonly href: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Replay', href: '#simulator' },
  { label: 'Run', href: '#run-it-yourself' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Switching', href: '#account-switching' },
  { label: 'Gates', href: '#gates' },
  { label: 'Safety', href: '#safety' },
  { label: 'FAQ', href: '#faq' },
];

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isGithubAvailable =
    Boolean(GITHUB_URL) &&
    (GITHUB_URL as string) !== 'TODO' &&
    (GITHUB_URL as string).trim().length > 0;

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl bg-black/85 backdrop-blur-md border border-border shadow-2xl transition-all duration-300 ${
        mobileMenuOpen ? 'rounded-[28px]' : 'rounded-full'
      }`}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3">
        {/* Brand Wordmark */}
        <a
          href="#hero"
          className="font-display font-bold text-lg sm:text-xl tracking-tight text-[#F5F0E8] hover:opacity-85 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-full px-2 py-0.5 flex items-center gap-0.5 shrink-0"
        >
          {PROJECT_NAME}
          <span className="text-accent">*</span>
        </a>

        {/* Desktop Nav (< 640px hidden) */}
        <nav
          aria-label="Main navigation"
          className="hidden sm:flex items-center space-x-1 lg:space-x-1.5"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-2.5 lg:px-3 py-1.5 rounded-full text-xs lg:text-sm font-medium text-[#F5F0E8]/75 hover:text-[#F5F0E8] hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right Action: GitHub, ThemeToggle, Mobile Menu Button */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {isGithubAvailable && (
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center border border-white/15 bg-white/5 hover:bg-white/10 text-[#F5F0E8] rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              GitHub
            </a>
          )}

          <ThemeToggle className="rounded-full bg-white/5 border-white/15 hover:bg-white/10 text-[#F5F0E8]" />

          {/* Mobile Menu Button (< 640px) */}
          <button
            type="button"
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="sm:hidden p-2 rounded-full text-[#F5F0E8]/80 hover:text-[#F5F0E8] hover:bg-white/10 border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
          >
            {mobileMenuOpen ? (
              <X strokeWidth={1.75} className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Menu strokeWidth={1.75} className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer (< 640px) */}
      {mobileMenuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="sm:hidden px-4 pb-4 pt-2 border-t border-white/10 flex flex-col gap-1 transition-all"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={closeMobileMenu}
              className="px-3 py-2 rounded-xl text-sm font-medium text-[#F5F0E8]/80 hover:text-[#F5F0E8] hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {item.label}
            </a>
          ))}

          {isGithubAvailable && (
            <div className="pt-2 mt-1 border-t border-white/10">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMobileMenu}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-xs font-medium rounded-full border border-white/15 bg-white/5 text-[#F5F0E8] hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                GitHub
              </a>
            </div>
          )}
        </nav>
      )}
    </header>
  );
};

export default Header;
