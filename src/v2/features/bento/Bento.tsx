import React, { useEffect, useRef, useState } from 'react';
import { Container } from '@/v2/ui/Container';
import { BENTO_MEDIA } from '@/v2/data/media';
import { COPY_V2 } from '@/v2/data/copy.v2';
import { bentoCards } from '@/v2/data/adapters';
import { Check, ArrowUpRight } from 'lucide-react';
import { useReducedMotion } from '@/v2/ui/useReducedMotion';

const base = import.meta.env.BASE_URL || './';
const prefix = base.endsWith('/') ? base : `${base}/`;

const BENTO_IMAGES: Record<string, string> = {
  '01': `${prefix}v2/media/bento-01.webp`,
  '02': `${prefix}v2/media/bento-02.webp`,
  '03': `${prefix}v2/media/bento-03.webp`,
};

const BENTO_FALLBACK_IMAGES: Record<string, string> = {
  '01': 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171918_4a5edc79-d78f-4637-ac8b-53c43c220606.png&w=1280&q=85',
  '02': 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171741_ed9845ab-f5b2-4018-8ce7-07cc01823522.png&w=1280&q=85',
  '03': 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171809_f56666dc-c099-4778-ad82-9ad4f209567b.png&w=1280&q=85',
};

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
      { threshold: 0.1 }
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

  return (
    <div className="w-full py-16 sm:py-24">
      <Container>
        {/* Section Header: exact ECSoC centered typography & tone */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20 flex flex-col items-center gap-1.5 sm:gap-2.5">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-[#E1E0CC] tracking-tight font-body">
            {COPY_V2.bento.title.plain}
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-gray-400 font-light font-body">
            {COPY_V2.bento.subtitle}
          </p>
        </div>

        {/* 4-Column Bento Grid: exact ECSoC layout, gaps, height & items-stretch */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 lg:h-[480px] gap-3 sm:gap-2 md:gap-1 items-stretch"
        >
          {/* Tile 0: Video Card (appears 1st) */}
          <div
            className="h-full flex flex-col transition-all duration-700 ease-out"
            style={{
              opacity: isInView || reducedMotion ? 1 : 0,
              transform: isInView || reducedMotion ? 'none' : 'scale(0.95)',
              transitionDelay: isInView && !reducedMotion ? '0ms' : '0ms',
            }}
          >
            <div className="relative flex-1 flex flex-col justify-end p-6 sm:p-8 rounded-2xl overflow-hidden border border-white/[0.05] min-h-[300px] md:min-h-[360px] lg:min-h-0 bg-neutral-950 group">
              {reducedMotion ? (
                <img
                  src={BENTO_MEDIA.poster}
                  alt={COPY_V2.bento.tile1.caption}
                  className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
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
                  className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
                  aria-hidden="true"
                >
                  {BENTO_MEDIA.webm && <source src={BENTO_MEDIA.webm} type="video/webm" />}
                  <source src={BENTO_MEDIA.src} type="video/mp4" />
                </video>
              )}

              {/* Subtle dark overlay for contrast */}
              <div
                className="absolute inset-0 bg-black/25 z-10 transition-colors duration-300 group-hover:bg-black/10 pointer-events-none"
                aria-hidden="true"
              />

              {/* Caption */}
              <h3 className="relative z-20 text-lg sm:text-xl font-medium text-[#E1E0CC] tracking-wide font-body">
                {COPY_V2.bento.tile1.caption}
              </h3>
            </div>
          </div>

          {/* Tiles 1-3: Cards 01, 02, 03 (appear sequentially on scroll) */}
          {cards.map((card, idx) => (
            <div
              key={card.number}
              className="h-full flex flex-col transition-all duration-700 ease-out"
              style={{
                opacity: isInView || reducedMotion ? 1 : 0,
                transform: isInView || reducedMotion ? 'none' : 'scale(0.95)',
                transitionDelay: isInView && !reducedMotion ? `${(idx + 1) * 130}ms` : '0ms',
              }}
            >
              <div className="flex-1 bg-[#212121] border border-white/[0.03] rounded-2xl p-6 sm:p-8 flex flex-col justify-between min-h-[300px] md:min-h-[360px] lg:min-h-0 relative hover:border-white/[0.08] transition-all duration-300">
                <div>
                  {/* Top Row: Thumbnail image on left + mono numeral on right */}
                  <div className="flex items-center justify-between mb-6">
                    <img
                      src={BENTO_IMAGES[card.number] || BENTO_FALLBACK_IMAGES[card.number]}
                      alt={card.title}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover select-none pointer-events-none border border-white/[0.05]"
                      loading="lazy"
                      onError={(e) => {
                        const fallback = BENTO_FALLBACK_IMAGES[card.number];
                        if (fallback && e.currentTarget.src !== fallback) {
                          e.currentTarget.src = fallback;
                        }
                      }}
                    />
                    <span className="text-[#dedbc8]/40 text-xs sm:text-sm font-semibold tracking-wider font-body">
                      {card.number}
                    </span>
                  </div>

                  {/* Title in Almarai font */}
                  <h3 className="text-lg sm:text-xl font-medium text-[#E1E0CC] mb-6 font-body">
                    {card.title}
                  </h3>

                  {/* Checklist */}
                  <ul className="flex flex-col gap-3">
                    {card.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start gap-2.5">
                        <Check
                          className="w-3.5 h-3.5 text-[#dedbc8] mt-1 shrink-0"
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                        <span className="text-gray-400 text-xs sm:text-sm leading-normal font-body">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom link: Learn more with 45-deg arrow */}
                <div className="mt-8">
                  <a
                    href={card.learnMoreHref}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#dedbc8] hover:text-[#E1E0CC] transition-colors duration-300 group/link font-body"
                  >
                    <span>Learn more</span>
                    <ArrowUpRight
                      className="w-3.5 h-3.5 transform transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
                      aria-hidden="true"
                    />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
};

export default Bento;
