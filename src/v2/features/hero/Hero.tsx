import React from 'react';
import { VideoBg } from '@/v2/ui/VideoBg';
import { HERO_MEDIA } from '@/v2/data/media';
import { COPY_V2 } from '@/v2/data/copy.v2';
import { ArrowUpRight } from 'lucide-react';
import { Nav } from './Nav';

const GRAIN_DATA_URI = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E";

export const Hero: React.FC = () => {
  return (
    <section
      id="hero"
      aria-label="Hero"
      className="relative w-full p-4 sm:p-[30px] lg:p-[30px] bg-black min-h-[calc(100vh-60px)]"
    >
      {/* Hero container: full viewport height, rounded ~40px, overflow hidden, relative */}
      <div className="relative w-full min-h-[calc(100vh-60px)] sm:min-h-[calc(100dvh-50px)] lg:min-h-[calc(100vh-60px)] rounded-[24px] sm:rounded-[32px] lg:rounded-[40px] overflow-hidden bg-black flex flex-col justify-end">
        
        {/* Flush Top Nav attached to the top edge of the hero container */}
        <Nav />

        {/* Video fills it edge-to-edge */}
        <VideoBg
          mp4Src={HERO_MEDIA.src}
          webmSrc={HERO_MEDIA.webm}
          posterSrc={HERO_MEDIA.poster}
          alt="Hush autonomous desktop orchestrator hero video"
          className="absolute inset-0"
        />

        {/* Film-grain overlay (inline SVG feTurbulence data URI, opacity 0.14, mix-blend-mode overlay) */}
        <div
          data-testid="hero-grain"
          className="hero-grain absolute inset-0 pointer-events-none z-10 opacity-[0.14] mix-blend-overlay"
          style={{ backgroundImage: `url("${GRAIN_DATA_URI}")` }}
          aria-hidden="true"
        />

        {/* Subtle dark vignette */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.45) 100%)' }}
          aria-hidden="true"
        />

        {/* Bottom-Left Wordmark & Bottom-Right Area */}
        <div className="relative z-20 w-full h-full flex flex-col justify-end px-6 sm:px-10 lg:px-16 pb-8 sm:pb-12 pt-28">
          
          {/* Bottom-Left Wordmark */}
          <div className="absolute bottom-[2vw] left-[4vw] z-20 flex items-start select-none">
            <h1 
              style={{ fontFamily: 'var(--font-display)' }}
              className="font-normal text-[26vw] sm:text-[25vw] md:text-[24vw] lg:text-[22vw] xl:text-[310px] tracking-[-0.04em] leading-[0.8] text-[#E4E2D0] flex items-start"
            >
              {COPY_V2.hero.wordmark}
              <span 
                style={{ fontFamily: 'var(--font-display)' }}
                className="text-[5vw] sm:text-[4vw] lg:text-[36px] xl:text-[48px] text-[#E4E2D0] ml-1 sm:ml-2 font-normal select-none"
              >
                *
              </span>
            </h1>
          </div>

          {/* Bottom-Right Area */}
          <div className="absolute bottom-[3vw] right-[4vw] z-20 max-w-[520px] flex flex-col items-start gap-5 ml-auto text-left">
            <p 
              style={{ fontFamily: 'var(--font-body)' }}
              className="text-base sm:text-[19px] font-light leading-[1.3] text-[#E4E2D0]/85 max-w-[520px]"
            >
              {COPY_V2.hero.paragraph}
            </p>

            <a
              href={COPY_V2.hero.ctaPillHref}
              className="bg-[#E4E2D0] hover:bg-white text-[#111] font-medium text-base sm:text-lg pl-6 pr-2 py-2 rounded-full inline-flex items-center gap-4 transition-all shadow-lg"
            >
              <span>{COPY_V2.hero.ctaPill}</span>
              <span className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-5 h-5 text-white" aria-hidden="true" />
              </span>
            </a>
          </div>

        </div>
      </div>
    </section>
  );
};
