import React, { useState } from 'react';
import { GITHUB_URL } from '@/data/brand';
import { COPY } from '@/data/copy';
import { ArrowRight, Check, Copy, Terminal } from 'lucide-react';

export const Hero: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const quickstartCommand = 'npx hush-agent';
  const isGithubAvailable =
    (GITHUB_URL as string) !== 'TODO' &&
    (GITHUB_URL as string).trim().length > 0;

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(quickstartCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = quickstartCommand;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section
      id="hero"
      aria-labelledby="hero-headline"
      className="relative overflow-hidden py-20 lg:py-32"
    >
      {/* Subtle radial wash behind hero */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_40%_at_50%_0%,color-mix(in_srgb,var(--color-accent)_7%,transparent)_0%,transparent_100%)]"
        aria-hidden="true"
      />

      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 text-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-border bg-surface-2 text-text-muted mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
          <span>{COPY.eyebrow}</span>
        </div>

        {/* Hero H1 */}
        <h1
          id="hero-headline"
          className="text-[44px] sm:text-[64px] lg:text-[72px] leading-[1.08] tracking-tight font-sans font-semibold text-text"
        >
          <span className="block">{COPY.hero.titleLine1}</span>
          <span className="block font-serif italic font-normal text-accent mt-1 sm:mt-2">
            {COPY.hero.titleLine2}
          </span>
        </h1>

        {/* Hero subhead */}
        <p className="mt-6 sm:mt-8 text-[17px] leading-[1.65] text-text-muted max-w-2xl mx-auto">
          {COPY.hero.subhead}
        </p>

        {/* CTAs */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <a
            href="#simulator"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-accent text-accent-contrast rounded-[10px] px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <span>{COPY.hero.ctaPrimary}</span>
            <ArrowRight className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
          </a>

          {isGithubAvailable ? (
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-border bg-transparent text-text hover:bg-surface-2 rounded-[10px] px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              <span>{COPY.hero.ctaSecondary}</span>
            </a>
          ) : (
            <span
              aria-disabled="true"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-border bg-transparent text-text-muted rounded-[10px] px-5 py-2.5 text-sm font-medium cursor-not-allowed select-none"
            >
              <span>{COPY.hero.ctaSecondary}</span>
            </span>
          )}
        </div>

        {/* Quickstart command pill */}
        <div className="mt-8 sm:mt-10 flex items-center justify-center">
          <div
            className="inline-flex items-center gap-2.5 sm:gap-3 px-3.5 py-2 rounded-[10px] border border-border bg-surface-2 transition-colors"
            role="region"
            aria-label="Quickstart terminal command"
          >
            <Terminal
              className="w-4 h-4 text-text-muted shrink-0"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <code className="font-mono text-xs sm:text-sm text-text select-all">
              {quickstartCommand}
            </code>
            <button
              type="button"
              onClick={handleCopyCommand}
              aria-label={copied ? 'Command copied' : 'Copy quickstart command'}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] text-xs font-medium border border-border bg-surface text-text hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {copied ? (
                <>
                  <Check
                    className="w-3.5 h-3.5 text-success shrink-0"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <span className="text-success font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy
                    className="w-3.5 h-3.5 text-text-muted shrink-0"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
