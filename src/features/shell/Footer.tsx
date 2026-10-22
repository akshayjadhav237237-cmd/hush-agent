import React from 'react';
import { PROJECT_NAME, GITHUB_URL, DEVPOST_URL } from '@/data/brand';
import { Award, ArrowUp } from 'lucide-react';

interface FooterLink {
  readonly label: string;
  readonly href: string;
}

const FOOTER_LINKS: readonly FooterLink[] = [
  { label: 'Simulator', href: '#simulator' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Gates', href: '#gates' },
  { label: 'Gemma 4 Facts', href: '#gemma-facts' },
  { label: 'Safety', href: '#safety' },
  { label: 'FAQ', href: '#faq' },
];

export const Footer: React.FC = () => {
  const isGithubAvailable =
    (GITHUB_URL as string) !== 'TODO' &&
    (GITHUB_URL as string).trim().length > 0;

  const isDevpostAvailable =
    (DEVPOST_URL as string) !== 'TODO' &&
    (DEVPOST_URL as string).trim().length > 0;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="footer" className="border-t border-border bg-surface transition-colors">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 items-start">
          {/* Column 1: Project Identity & Hackathon Badge */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl sm:text-2xl font-normal text-text tracking-tight">
                {PROJECT_NAME}
                <span className="text-accent">.</span>
              </span>
            </div>
            <p className="text-sm text-text-muted leading-relaxed">
              Autonomous research, planning, and code delivery orchestrated by Gemma 4. Halts execution only when human judgment is strictly required.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-border bg-surface-2 text-text">
              <Award className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} aria-hidden="true" />
              <span>Targeting Best Use of Gemma 4</span>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="space-y-3 md:text-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text">
              Navigation
            </h3>
            <ul className="space-y-2 text-sm text-text-muted">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="hover:text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: License & Resources */}
          <div className="space-y-3 md:text-right">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text">
              Open Source
            </h3>
            <p className="text-sm text-text-muted">
              Dual-licensed under <span className="text-text font-medium">MIT</span> and{' '}
              <span className="text-text font-medium">Apache 2.0</span>.
            </p>
            <p className="text-xs text-text-muted leading-relaxed">
              Built for the Google Gemma 4 Developer Challenge. Powered by Gemma 4 local inference, Claude, Gemini Deep Research, and Antigravity.
            </p>
            {(isGithubAvailable || isDevpostAvailable) && (
              <div className="pt-2 flex flex-col md:items-end gap-1.5">
                {isGithubAvailable && (
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-text hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                  >
                    Source repository &rarr;
                  </a>
                )}
                {isDevpostAvailable && (
                  <a
                    href={DEVPOST_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-text hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                  >
                    Devpost entry &rarr;
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <p>
            &copy; {new Date().getFullYear()} {PROJECT_NAME}. All rights reserved.
          </p>
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Back to top"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border border-border bg-surface-2 text-text hover:bg-border transition-colors text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
};
