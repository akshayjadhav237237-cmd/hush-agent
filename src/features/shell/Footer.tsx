import React from 'react';
import {
  PROJECT_NAME,
  TAGLINE,
  GITHUB_URL,
  DEVPOST_URL,
  HACKATHON_NAME,
} from '@/data/brand';
import { CopyLink } from '@/components/CopyLink';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Award, ArrowUp, ExternalLink } from 'lucide-react';

interface QuickLink {
  readonly label: string;
  readonly href: string;
}

const QUICK_LINKS: readonly QuickLink[] = [
  { label: 'Simulator Replay', href: '#simulator' },
  { label: 'Run It Yourself', href: '#run-it-yourself' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Account Switching', href: '#account-switching' },
  { label: 'Safety Gates', href: '#gates' },
  { label: 'Safety & Guardrails', href: '#safety' },
  { label: 'FAQ', href: '#faq' },
];

/**
 * Validates external URLs against 'TODO' or empty placeholders.
 */
function isValidUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  return trimmed.length > 0 && trimmed.toUpperCase() !== 'TODO';
}

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    stroke="currentColor"
    strokeWidth="1.75"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export const Footer: React.FC = () => {
  const isGithubAvailable = isValidUrl(GITHUB_URL);
  const isDevpostAvailable = isValidUrl(DEVPOST_URL);
  const isHackathonConfigured = isValidUrl(HACKATHON_NAME);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer
      id="footer"
      className="w-full border-t border-border bg-surface text-text transition-colors"
    >
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* 4-column layout on desktop, stacked on mobile (< 640px) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 items-start">
          {/* Column 1: Brand, Tagline, Award & Share */}
          <div className="space-y-4 min-w-0">
            <div className="flex items-center gap-1.5">
              <a
                href="#hero"
                className="font-serif text-2xl sm:text-3xl font-normal text-text tracking-tight hover:opacity-85 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded inline-flex items-baseline"
                aria-label={`${PROJECT_NAME} - Back to top`}
              >
                <span>HUSH</span>
                <span className="text-accent font-mono select-none" aria-hidden="true">*</span>
              </a>
            </div>

            <p className="text-sm text-text-muted leading-relaxed break-words">
              {TAGLINE || 'Builds quietly. Speaks only when it must.'}
            </p>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-border bg-surface-2 text-text max-w-full">
              <Award className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <span className="truncate">Targeting Best Use of Gemma 4</span>
            </div>

            <div className="pt-2">
              <CopyLink />
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3 min-w-0">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-text">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm text-text-muted">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded inline-block"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Open Source & Stack */}
          <div className="space-y-3 min-w-0">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-text">
              Open Source
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Hush is released under the Apache 2.0 license. Gemma 4 is released by Google under the Apache 2.0 license.
            </p>
            <p className="text-xs text-text-muted leading-relaxed">
              Graphify is a separate open-source project by{' '}
              <a
                href="https://graphify.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-text transition-colors"
              >
                Graphify Labs
              </a>
              , used under its Apache 2.0 license (
              <a
                href="https://github.com/Graphify-Labs/graphify"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-text transition-colors"
              >
                GitHub
              </a>
              ).
            </p>
            <p className="text-xs text-text-muted leading-relaxed">
              {isHackathonConfigured
                ? `Built for ${HACKATHON_NAME}.`
                : 'Built at a hackathon with Gemma 4.'}{' '}
              Powered by Gemma 4, Claude, Gemini Deep Research, and Antigravity.
            </p>
          </div>

          {/* Column 4: Community & Contact */}
          <div className="space-y-3 min-w-0">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-text">
              Community & Contact
            </h3>

            {isGithubAvailable || isDevpostAvailable ? (
              <ul className="space-y-2.5 text-sm">
                {isGithubAvailable && (
                  <li>
                    <a
                      href={GITHUB_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-text-muted hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                    >
                      <GithubIcon className="w-4 h-4 shrink-0" />
                      <span>GitHub Repository</span>
                      <ExternalLink className="w-3 h-3 opacity-60 shrink-0" aria-hidden="true" />
                    </a>
                  </li>
                )}
                {isDevpostAvailable && (
                  <li>
                    <a
                      href={DEVPOST_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-text-muted hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                    >
                      <span>Devpost Entry</span>
                      <ExternalLink className="w-3 h-3 opacity-60 shrink-0" aria-hidden="true" />
                    </a>
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-xs text-text-muted">
                Repository and submission links will appear upon release.
              </p>
            )}

            <p className="text-xs text-text-muted leading-relaxed pt-2">
              Questions, bug reports, and pull requests are welcomed via GitHub Issues.
            </p>
          </div>
        </div>

        {/* Bottom Bar: Copyright, License Note & Smooth Back to Top */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <p className="text-center sm:text-left">
            &copy; {new Date().getFullYear()} {PROJECT_NAME}. All rights reserved. Released under Apache 2.0 License.
          </p>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Back to top"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border border-border bg-surface-2 hover:bg-border text-text transition-colors text-xs font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
