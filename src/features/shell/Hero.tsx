import React, { useState, useEffect } from 'react';
import { TAGLINE } from '@/data/brand';
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
        // Fall back gracefully to radial gradient
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const taglineText =
    TAGLINE || `${COPY.hero.titleLine1} ${COPY.hero.titleLine2}`;

  return (
    <section
      id="hero"
      aria-labelledby="hero-wordmark"
      className="relative m-4 sm:m-7 min-h-[calc(100vh-32px)] rounded-[40px] overflow-hidden flex flex-col justify-between p-8 sm:p-12 lg:p-16 border border-border/40 shadow-2xl"
    >
      {/* Background Media or Radial Gradient */}
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
            'radial-gradient(circle at 50% 30%, #0a1f44 0%, #030712 60%, #000000 100%)',
        }}
        aria-hidden="true"
      />

      {/* Top Area: Eyebrow Tag / Mono Label */}
      <div className="pt-16 sm:pt-14 flex items-center justify-between z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-xs border border-white/10 bg-black/40 text-text-muted backdrop-blur-sm select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" aria-hidden="true" />
          <span className="text-text font-semibold">[ HUSH ]</span>
          <span className="text-white/30">•</span>
          <span>{COPY.eyebrow}</span>
        </div>
      </div>

      {/* Bottom Area: Giant Wordmark (left) and Tagline / CTA / Scroll (right) */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-4 sm:pb-6 z-10 mt-auto">
        {/* Giant wordmark bottom-left */}
        <div className="select-none">
          <h1
            id="hero-wordmark"
            className="font-display font-[800] text-[18vw] sm:text-[24vw] lg:text-[28vw] leading-[0.85] tracking-tighter text-text select-none whitespace-nowrap"
          >
            HUSH
            <span className="text-accent align-super text-[0.45em] ml-1 font-normal select-none">
              *
            </span>
          </h1>
        </div>

        {/* Bottom-right: Tagline, Pill CTA button, Scroll indicator */}
        <div className="flex flex-col items-start lg:items-end max-w-md lg:text-right pb-2 shrink-0">
          <p className="text-base sm:text-lg text-text-muted font-sans leading-relaxed mb-6">
            {taglineText}
          </p>

          <a
            href="#simulator"
            className="bg-[#F5F0E8] text-black rounded-full px-6 py-3 font-medium text-sm flex items-center gap-3 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span>{COPY.hero.ctaPrimary}</span>
            <span
              className="w-5 h-5 rounded-full bg-black text-[#F5F0E8] flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            >
              <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
            </span>
          </a>

          <div
            className="font-mono text-xs text-text-muted mt-3 select-none flex items-center gap-1.5"
            aria-hidden="true"
          >
            <span>SCROLL</span>
            <span className="animate-bounce">↓</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
