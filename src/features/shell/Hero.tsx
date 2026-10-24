import React, { useState, useEffect } from 'react';
import { GITHUB_URL } from '@/data/brand';
import { COPY } from '@/data/copy';
import { ArrowRight } from 'lucide-react';

export const Hero: React.FC = () => {
  const [hasMedia, setHasMedia] = useState<'video' | 'image' | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch('/hero.mp4', { method: 'HEAD' })
      .then((res) => {
        if (res.ok && isMounted) {
          setHasMedia('video');
        } else {
          return fetch('/hero.jpg', { method: 'HEAD' }).then((imgRes) => {
            if (imgRes.ok && isMounted) {
              setHasMedia('image');
            }
          });
        }
      })
      .catch(() => {
        // Fall back gracefully to background gradient
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const isGithubAvailable =
    (GITHUB_URL as string) !== 'TODO' &&
    (GITHUB_URL as string).trim().length > 0;

  return (
    <section
      id="hero"
      aria-labelledby="hero-headline"
      className="relative m-3 sm:m-6 lg:m-8 rounded-[28px] sm:rounded-[36px] overflow-hidden border border-border bg-surface/40 backdrop-blur-sm shadow-2xl flex flex-col items-center justify-center text-center p-6 sm:p-12 lg:p-16 min-h-[calc(90vh-2rem)] sm:min-h-[calc(88vh-3rem)]"
    >
      {/* Background Media or Radial Glow */}
      {hasMedia === 'video' && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover -z-10 pointer-events-none"
          src="/hero.mp4"
        />
      )}
      {hasMedia === 'image' && (
        <img
          src="/hero.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover -z-10 pointer-events-none"
        />
      )}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse at 50% 35%, rgba(34, 255, 110, 0.08) 0%, rgba(10, 31, 68, 0.25) 45%, rgba(0, 0, 0, 0.95) 100%)',
        }}
        aria-hidden="true"
      />

      {/* Eyebrow Tag / Mono Label */}
      <div className="pt-12 sm:pt-6 mb-6 sm:mb-8 z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-xs border border-white/10 dark:border-white/10 bg-black/40 text-text-muted backdrop-blur-sm select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" aria-hidden="true" />
          <span className="text-text font-semibold">[ HUSH ]</span>
          <span className="text-white/30">•</span>
          <span>{COPY.eyebrow}</span>
        </div>
      </div>

      {/* Main Headline */}
      <div className="max-w-4xl mx-auto z-10">
        <h1
          id="hero-headline"
          className="font-display font-[800] text-4xl sm:text-6xl md:text-7xl lg:text-[5.25rem] leading-[1.06] tracking-tight text-text"
        >
          <span className="block text-text-mint">{COPY.hero.titleLine1}</span>
          <span className="block font-serif italic font-normal text-accent mt-1 sm:mt-2">
            {COPY.hero.titleLine2}
          </span>
        </h1>

        {/* Subhead */}
        <p className="mt-6 sm:mt-8 text-base sm:text-lg lg:text-xl leading-relaxed text-text-muted max-w-2xl mx-auto font-sans">
          {COPY.hero.subhead}
        </p>

        <p className="mt-3 text-xs font-mono text-text-muted tracking-wide">
          Works with Graphify for codebase memory.
        </p>

        {/* CTAs */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
          <a
            href="#simulator"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-text text-bg rounded-full px-7 py-3.5 text-sm font-semibold hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span>{COPY.hero.ctaPrimary}</span>
            <span
              className="w-5 h-5 rounded-full bg-bg text-text flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            >
              <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
            </span>
          </a>

          {isGithubAvailable && (
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-border bg-surface-2/70 text-text hover:bg-surface-2 rounded-full px-6 py-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span>{COPY.hero.ctaSecondary}</span>
            </a>
          )}
        </div>

        {/* Scroll Indicator */}
        <div className="mt-10 sm:mt-12 flex items-center justify-center">
          <a
            href="#simulator"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-text-muted hover:text-accent transition-colors tracking-widest uppercase select-none"
          >
            <span>SCROLL</span>
            <span className="animate-bounce" aria-hidden="true">
              ↓
            </span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
