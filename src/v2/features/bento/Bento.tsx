import React, { useEffect, useRef, useState } from 'react';
import { Container } from '@/v2/ui/Container';
import { BENTO_MEDIA } from '@/v2/data/media';
import { COPY_V2 } from '@/v2/data/copy.v2';
import { bentoCards } from '@/v2/data/adapters';
import { Bot, Shield, Network, Check } from 'lucide-react';
import { useReducedMotion } from '@/v2/ui/useReducedMotion';

export const Bento: React.FC = () => {
  const cards = bentoCards();
  const reducedMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  // Trigger one-by-one scroll reveal
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Guarantee continuous video autoplay
  useEffect(() => {
    if (reducedMotion) return;

    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = true;
    video.muted = true;

    const events: (keyof WindowEventMap)[] = ['pointerdown', 'touchstart', 'keydown', 'scroll'];

    const handleInteraction = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
      events.forEach((ev) => window.removeEventListener(ev, handleInteraction));
    };

    const initialPlay = video.play();
    if (initialPlay !== undefined) {
      initialPlay.catch(() => {
        events.forEach((ev) => {
          window.addEventListener(ev, handleInteraction, { once: true, passive: true });
        });
      });
    }

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleInteraction));
    };
  }, [reducedMotion]);

  const hoverLiftClass = reducedMotion
    ? ''
    : 'motion-safe:hover:-translate-y-1 motion-safe:transition-transform motion-safe:duration-200 motion-reduce:transform-none';

  const getIcon = (name: 'bot' | 'shield' | 'network') => {
    switch (name) {
      case 'bot':
        return <Bot className="w-5 h-5 text-[#dedbc8]" strokeWidth={1.5} />;
      case 'shield':
        return <Shield className="w-5 h-5 text-[#dedbc8]" strokeWidth={1.5} />;
      case 'network':
        return <Network className="w-5 h-5 text-[#dedbc8]" strokeWidth={1.5} />;
    }
  };

  return (
    <div className="w-full py-16 sm:py-24">
      <Container>
        {/* Section Header */}
        <div className="mb-12 sm:mb-16">
          <h2 className="font-serif-title text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[var(--v2-text)] font-normal tracking-tight">
            {COPY_V2.bento.title.plain}
          </h2>
          <p className="mt-2.5 text-base sm:text-lg text-[var(--v2-muted)] font-body">
            {COPY_V2.bento.subtitle}
          </p>
        </div>

        {/* 4-Column Bento Grid: tighter gaps, staggered scroll reveal */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 items-stretch"
        >
          {/* Tile 1: Video card (appears 1st) */}
          <div
            style={{ transitionDelay: isInView && !reducedMotion ? '0ms' : '0ms' }}
            className={`relative min-h-[380px] sm:min-h-[440px] rounded-[var(--v2-radius-card,28px)] overflow-hidden border border-white/[0.08] bg-[var(--v2-card)] shadow-lg flex flex-col justify-end p-0 ${hoverLiftClass} transition-all duration-700 ease-out ${
              isInView || reducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {reducedMotion ? (
              <img
                src={BENTO_MEDIA.poster}
                alt={COPY_V2.bento.tile1.caption}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                muted
                loop
                playsInline
                controls={false}
                poster={BENTO_MEDIA.poster}
                className="absolute inset-0 w-full h-full object-cover"
                aria-hidden="true"
              >
                {BENTO_MEDIA.webm && <source src={BENTO_MEDIA.webm} type="video/webm" />}
                <source src={BENTO_MEDIA.src} type="video/mp4" />
              </video>
            )}

            {/* Dark bottom gradient for caption contrast */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none"
              aria-hidden="true"
            />

            {/* Caption bottom-left */}
            <div className="relative z-10 p-6 sm:p-8">
              <p className="font-serif-title text-2xl sm:text-3xl text-[var(--v2-text)] font-normal leading-tight">
                {COPY_V2.bento.tile1.caption}
              </p>
            </div>
          </div>

          {/* Tiles 2-4: Feature cards (appear 2nd, 3rd, 4th one-by-one) */}
          {cards.map((card, idx) => (
            <div
              key={card.number}
              style={{ transitionDelay: isInView && !reducedMotion ? `${(idx + 1) * 130}ms` : '0ms' }}
              className={`flex flex-col justify-between rounded-[var(--v2-radius-card,28px)] p-6 sm:p-7 bg-[var(--v2-card)] border border-white/[0.08] shadow-lg ${hoverLiftClass} transition-all duration-700 ease-out ${
                isInView || reducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div>
                {/* Top Row: Icon in subtle rounded square, mono numeral */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#dedbc8]">
                    {getIcon(card.iconName)}
                  </div>
                  <span className="font-mono text-xs tracking-wider text-[var(--v2-muted)]">
                    {card.number}
                  </span>
                </div>

                {/* Serif Title */}
                <h3 className="font-serif-title text-xl sm:text-2xl text-[var(--v2-text)] font-normal mb-5 leading-snug">
                  {card.title}
                </h3>

                {/* Checkmark List */}
                <ul className="space-y-3.5 mb-8">
                  {card.items.map((item, itemIdx) => (
                    <li
                      key={itemIdx}
                      className="flex items-start gap-2.5 text-xs sm:text-sm text-[var(--v2-text)] opacity-80 font-body leading-relaxed"
                    >
                      <span className="shrink-0 mt-0.5 text-[#dedbc8]" aria-hidden="true">
                        <Check className="w-4 h-4" strokeWidth={1.5} />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom: Learn more link */}
              <div className="pt-4 border-t border-white/[0.06] mt-auto">
                <a
                  href={card.learnMoreHref}
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-[#dedbc8]/80 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[#dedbc8]"
                >
                  <span>Learn more ↗</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
};

export default Bento;
