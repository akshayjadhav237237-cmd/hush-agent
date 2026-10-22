import React, { useState, useEffect } from 'react';
import { TAGLINE } from '@/data/brand';
import { COPY } from '@/data/copy';
import { ArrowRight } from 'lucide-react';

export const Hero: React.FC = () => {
  const [videoAvailable, setVideoAvailable] = useState<boolean>(false);

  useEffect(() => {
    // Check if /hero.mp4 exists without throwing uncaught errors
    fetch('/hero.mp4', { method: 'HEAD' })
      .then((res) => {
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('video') || contentType.includes('mp4')) {
            setVideoAvailable(true);
          }
        }
      })
      .catch(() => {
        setVideoAvailable(false);
      });
  }, []);

  const taglineParts = TAGLINE.split('.');
  const taglinePart1 = taglineParts[0] ? `${taglineParts[0].trim()}.` : COPY.hero.titleLine1;
  const taglinePart2 = taglineParts[1]?.trim() || COPY.hero.titleLine2;

  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="relative m-4 sm:m-7 min-h-[calc(100vh-60px)] rounded-[40px] overflow-hidden flex flex-col justify-between p-8 sm:p-12 lg:p-16 border border-white/[0.06]"
      style={{
        background: 'radial-gradient(circle at 50% 30%, #0a1f44 0%, #030712 60%, #000000 100%)',
        backgroundColor: '#000000',
      }}
    >
      {/* Optional video background fallback if /hero.mp4 is available */}
      {videoAvailable && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none mix-blend-screen"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
      )}

      {/* Subtle radial shading overlay */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,255,110,0.04)_0%,_transparent_70%)]"
        aria-hidden="true"
      />

      {/* Top area */}
      <div className="relative z-10 flex items-center justify-between w-full pt-12 sm:pt-10 md:pt-4">
        {/* Section label mono: [ HUSH ] in green / muted font-mono text-xs tracking-[0.2em] */}
        <div
          className="font-mono text-xs tracking-[0.2em] text-[#22FF6E] uppercase select-none"
          style={{ fontFamily: "'JetBrains Mono', var(--font-mono), monospace" }}
        >
          [ HUSH ]
        </div>

        {/* Eyebrow: Built with Gemma 4 tag */}
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono border border-white/[0.08] bg-[#141414]/90 text-[#F5F0E8]/80 backdrop-blur-sm select-none"
          style={{ fontFamily: "'JetBrains Mono', var(--font-mono), monospace" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#22FF6E] animate-pulse" aria-hidden="true" />
          <span>{COPY.eyebrow}</span>
        </div>
      </div>

      {/* Bottom area */}
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 lg:gap-12 pt-16">
        {/* Bottom-left: Giant wordmark */}
        <div className="shrink-0 select-none">
          <h1
            id="hero-title"
            className="text-[#F5F0E8] font-extrabold tracking-tighter text-[20vw] sm:text-[24vw] lg:text-[28vw] leading-[0.85] select-none inline-flex items-start"
            style={{
              fontFamily: "'Archivo', 'Space Grotesk', var(--font-sans), sans-serif",
            }}
          >
            <span>HUSH</span>
            <span
              className="text-[#22FF6E] align-super text-[0.4em] leading-none ml-1 select-none font-sans"
              aria-hidden="true"
            >
              *
            </span>
          </h1>
        </div>

        {/* Bottom-right container */}
        <div className="flex flex-col items-start md:items-end text-left md:text-right max-w-md pb-2">
          {/* Tagline text: TAGLINE ("Builds quietly. Speaks only when it must.") or existing hero subhead */}
          <div className="space-y-2.5 mb-6">
            <p
              className="text-base sm:text-lg lg:text-xl font-normal text-[#F0FFE8] tracking-tight leading-snug"
              style={{ fontFamily: "'Space Grotesk', var(--font-sans), sans-serif" }}
            >
              <span>{taglinePart1} </span>
              <span
                className="italic text-[#22FF6E]"
                style={{ fontFamily: "'Cormorant Garamond', var(--font-serif), Georgia, serif" }}
              >
                {taglinePart2}
              </span>
            </p>
            <p
              className="text-xs sm:text-sm text-[rgba(245,240,232,0.45)] leading-relaxed"
              style={{ fontFamily: "'Space Grotesk', var(--font-sans), sans-serif" }}
            >
              {COPY.hero.subhead}
            </p>
          </div>

          {/* White pill CTA button */}
          <a
            href="#simulator"
            className="group inline-flex items-center gap-3 bg-[#F5F0E8] text-black rounded-full px-6 py-3 font-medium text-sm hover:opacity-95 transition-all shadow-lg hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22FF6E]"
            style={{ fontFamily: "'Space Grotesk', var(--font-sans), sans-serif" }}
          >
            <span>{COPY.hero.ctaPrimary}</span>
            <span className="w-6 h-6 rounded-full bg-black text-[#F5F0E8] flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5">
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
            </span>
          </a>

          {/* Small mono scroll indicator */}
          <a
            href="#simulator"
            className="inline-flex items-center gap-1.5 text-[11px] font-mono tracking-widest text-[rgba(245,240,232,0.45)] hover:text-[#22FF6E] transition-colors mt-4 select-none uppercase"
            style={{ fontFamily: "'JetBrains Mono', var(--font-mono), monospace" }}
          >
            <span>SCROLL</span>
            <span className="animate-bounce" aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
