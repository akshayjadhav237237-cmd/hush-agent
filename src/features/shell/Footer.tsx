import React from 'react';
import { PROJECT_NAME, GITHUB_URL, DEVPOST_URL, HACKATHON_NAME } from '@/data/brand';
import { Award, ArrowUp, ExternalLink } from 'lucide-react';

interface QuickLink {
  readonly label: string;
  readonly href: string;
}

const QUICK_LINKS: readonly QuickLink[] = [
  { label: 'Replay', href: '#simulator' },
  { label: 'Run', href: '#run-it-yourself' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Switching', href: '#account-switching' },
  { label: 'Gates', href: '#gates' },
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

  const isHackathonConfigured =
    (HACKATHON_NAME as string) !== 'TODO' &&
    (HACKATHON_NAME as string).trim().length > 0;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      id="footer"
      aria-label="Site footer"
      className="w-full bg-black border-t border-white/[0.06] pt-16 pb-12 text-[#F5F0E8] font-['Space_Grotesk',sans-serif]"
    >
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* 4-column layout on md/lg screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 items-start">
          {/* Column 1: Wordmark, Tagline & License */}
          <div className="space-y-4">
            <a
              href="#hero"
              className="inline-flex items-center gap-0.5 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22FF6E] rounded"
            >
              <span className="font-['Archivo',sans-serif] text-2xl font-bold tracking-tight text-[#F5F0E8] group-hover:text-[#F0FFE8] transition-colors">
                HUSH
              </span>
              <span className="font-['JetBrains_Mono',monospace] text-2xl font-bold text-[#22FF6E] leading-none">
                *
              </span>
            </a>

            <p className="text-sm text-[rgba(245,240,232,0.75)] leading-relaxed">
              Builds quietly. Speaks only when it must.
            </p>

            <p className="text-xs text-[rgba(245,240,232,0.45)] leading-relaxed pt-1">
              MIT licensed. Gemma 4 is released by Google under the Apache 2.0 license.
            </p>
          </div>

          {/* Column 2: QUICK LINKS */}
          <div>
            <h3 className="font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(245,240,232,0.45)] mb-4 select-none">
              [ QUICK LINKS ]
            </h3>
            <ul className="space-y-2.5 text-sm">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-[rgba(245,240,232,0.75)] hover:text-[#22FF6E] transition-colors duration-150 inline-block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22FF6E] rounded"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: COMMUNITY */}
          <div className="space-y-4">
            <h3 className="font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(245,240,232,0.45)] mb-4 select-none">
              [ COMMUNITY ]
            </h3>
            <ul className="space-y-2.5 text-sm">
              {isGithubAvailable ? (
                <li>
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 text-[rgba(245,240,232,0.75)] hover:text-[#22FF6E] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22FF6E] rounded"
                  >
                    <span>GitHub Repository</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[rgba(245,240,232,0.45)] group-hover:text-[#22FF6E] transition-colors" strokeWidth={1.5} aria-hidden="true" />
                  </a>
                </li>
              ) : (
                <li className="text-xs text-[rgba(245,240,232,0.45)]">
                  GitHub repository pending
                </li>
              )}

              {isDevpostAvailable ? (
                <li>
                  <a
                    href={DEVPOST_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 text-[rgba(245,240,232,0.75)] hover:text-[#22FF6E] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22FF6E] rounded"
                  >
                    <span>Devpost Submission</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[rgba(245,240,232,0.45)] group-hover:text-[#22FF6E] transition-colors" strokeWidth={1.5} aria-hidden="true" />
                  </a>
                </li>
              ) : (
                <li className="text-xs text-[rgba(245,240,232,0.45)]">
                  Devpost submission placeholder
                </li>
              )}
            </ul>

            <p className="text-xs text-[rgba(245,240,232,0.45)] leading-relaxed pt-2">
              Graphify is an open-source project by{' '}
              <a
                href="https://github.com/Graphify-Labs/graphify"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-[#22FF6E] transition-colors"
              >
                Graphify Labs
              </a>
              , used under Apache 2.0.
            </p>
          </div>

          {/* Column 4: CONTACT & HACKATHON */}
          <div className="space-y-4">
            <h3 className="font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(245,240,232,0.45)] mb-4 select-none">
              [ CONTACT &amp; HACKATHON ]
            </h3>
            <p className="text-sm text-[rgba(245,240,232,0.75)] leading-relaxed">
              {isHackathonConfigured
                ? `Built for ${HACKATHON_NAME}.`
                : 'Built at a hackathon with Gemma 4.'}
            </p>
            <p className="text-xs text-[rgba(245,240,232,0.45)] leading-relaxed">
              Powered by Gemma 4, Claude, Gemini Deep Research, and Antigravity.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[12px] bg-[#141414] border border-white/[0.06] text-xs font-['JetBrains_Mono',monospace] text-[rgba(245,240,232,0.75)]">
              <Award className="w-3.5 h-3.5 text-[#22FF6E]" strokeWidth={1.5} aria-hidden="true" />
              <span>Targeting Best Use of Gemma 4</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Back to Top */}
        <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-['JetBrains_Mono',monospace] text-[rgba(245,240,232,0.45)]">
          <p>
            &copy; {new Date().getFullYear()} {PROJECT_NAME}. All rights reserved.
          </p>
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Back to top"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[12px] border border-white/[0.06] bg-[#141414] text-[rgba(245,240,232,0.75)] hover:text-[#22FF6E] hover:border-white/[0.12] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22FF6E]"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5 text-[#22FF6E]" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
};
