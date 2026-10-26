import React from 'react';
import { Container } from '@/v2/ui/Container';
import { COPY_V2 } from '@/v2/data/copy.v2';
import { HACKATHON_NAME, DEVPOST_URL } from '@/data/brand';
import { ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  const hasBuiltFor =
    Boolean(HACKATHON_NAME) &&
    HACKATHON_NAME !== 'TODO' &&
    Boolean(DEVPOST_URL) &&
    DEVPOST_URL !== 'TODO';

  return (
    <footer id="footer" className="w-full border-t border-[var(--v2-line)] bg-[var(--v2-bg)] py-16 sm:py-20 text-xs font-mono">
      <Container>
        {/* Main Footer Grid */}
        <div className={`grid grid-cols-1 ${hasBuiltFor ? 'md:grid-cols-4 lg:grid-cols-5' : 'md:grid-cols-3 lg:grid-cols-4'} gap-10 sm:gap-12 mb-16`}>
          {/* Brand Col */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 font-mono font-bold text-2xl text-[var(--v2-text)] tracking-tight mb-3">
              <span>{COPY_V2.footer.wordmark}</span>
              <span className="w-2 h-2 rounded-full bg-[var(--v2-accent)] inline-block" aria-hidden="true" />
            </div>
            <p className="text-[var(--v2-muted)] font-body text-sm max-w-sm leading-relaxed mb-6">
              {COPY_V2.footer.tagline}
            </p>
          </div>

          {/* Quick Links Col */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-[var(--v2-muted)] mb-4">
              QUICK LINKS
            </h4>
            <ul className="space-y-2.5">
              {COPY_V2.footer.quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[var(--v2-text)]/75 hover:text-[var(--v2-accent)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--v2-accent)] rounded-xs"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Project Col */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-[var(--v2-muted)] mb-4">
              PROJECT
            </h4>
            <ul className="space-y-2.5">
              {COPY_V2.footer.projectLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[var(--v2-text)]/75 hover:text-[var(--v2-accent)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--v2-accent)] rounded-xs"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-60" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Built For Col (rendered only if not TODO) */}
          {hasBuiltFor && (
            <div>
              <h4 className="font-mono text-xs uppercase tracking-widest text-[var(--v2-muted)] mb-4">
                BUILT FOR
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href={DEVPOST_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[var(--v2-text)]/75 hover:text-[var(--v2-accent)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--v2-accent)] rounded-xs"
                  >
                    <span>{HACKATHON_NAME}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-60" aria-hidden="true" />
                  </a>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Bottom Attribution & License bar */}
        <div className="pt-8 border-t border-[var(--v2-line)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs font-mono text-[var(--v2-muted)]">
          <p>{COPY_V2.footer.attribution}</p>
          <p>{COPY_V2.footer.license}</p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
