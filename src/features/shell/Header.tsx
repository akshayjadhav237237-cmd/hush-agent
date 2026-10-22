import React, { useState } from 'react';
import { PROJECT_NAME, GITHUB_URL } from '@/data/brand';
import { COPY } from '@/data/copy';
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
    (GITHUB_URL as string) !== 'TODO' &&
    (GITHUB_URL as string).trim().length > 0;

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/90 backdrop-blur-sm transition-colors">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand Wordmark & Badge */}
          <div className="flex items-center gap-3 min-w-0">
            <a
              href="#hero"
              className="font-serif text-xl sm:text-2xl font-normal text-text tracking-tight hover:opacity-85 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded shrink-0"
            >
              {PROJECT_NAME}
              <span className="text-accent">.</span>
            </a>
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-border bg-surface-2 text-text-muted select-none whitespace-nowrap"
              aria-label="Built with Gemma 4 badge"
            >
              {COPY.eyebrow}
            </span>
          </div>

          {/* Desktop Nav */}
          <nav
            aria-label="Main navigation"
            className="hidden md:flex items-center space-x-1 lg:space-x-1.5"
          >
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 rounded-[10px] text-sm font-medium text-text-muted hover:text-text hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right Action: GitHub Link */}
          <div className="hidden md:flex items-center">
            {isGithubAvailable ? (
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-border bg-transparent text-text hover:bg-surface-2 rounded-[10px] px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                GitHub
              </a>
            ) : (
              <span
                aria-disabled="true"
                className="border border-border bg-transparent text-text-muted rounded-[10px] px-3.5 py-1.5 text-xs font-medium cursor-not-allowed select-none"
              >
                GitHub
              </span>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={toggleMobileMenu}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="p-2 rounded-[10px] text-text-muted hover:text-text hover:bg-surface-2 border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {mobileMenuOpen ? (
                <X strokeWidth={1.5} className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu strokeWidth={1.5} className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="md:hidden border-t border-border bg-surface px-4 py-4 space-y-1 transition-all"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={closeMobileMenu}
              className="block px-3 py-2 rounded-[10px] text-sm font-medium text-text-muted hover:text-text hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {item.label}
            </a>
          ))}

          <div className="pt-3 mt-2 border-t border-border">
            {isGithubAvailable ? (
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMobileMenu}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-xs font-medium rounded-[10px] border border-border bg-surface-2 text-text hover:bg-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                GitHub
              </a>
            ) : (
              <div
                aria-disabled="true"
                className="w-full inline-flex items-center justify-center px-4 py-2 text-xs font-medium rounded-[10px] border border-border bg-surface-2 text-text-muted cursor-not-allowed select-none"
              >
                GitHub
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};
