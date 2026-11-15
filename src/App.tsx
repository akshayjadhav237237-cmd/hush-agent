import React from 'react';
import { Header } from '@/features/shell/Header';
import { Hero } from '@/features/shell/Hero';
import { JudgeStrip } from '@/features/judge/JudgeStrip';
import { SectionProgress } from '@/features/progress/SectionProgress';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Simulator } from '@/features/simulator/Simulator';
import { RunItYourself } from '@/features/run-it-yourself/RunItYourself';
import { Architecture } from '@/features/architecture/Architecture';
import { ArchitectureDiagram } from '@/features/diagram/ArchitectureDiagram';
import { GraphSection } from '@/features/graph/GraphSection';
import { AccountSwitchingIllustration } from '@/features/account-switching/AccountSwitchingIllustration';
import { Gates } from '@/features/gates/Gates';
import { GemmaFacts } from '@/features/gemma/GemmaFacts';
import { Safety } from '@/features/safety/Safety';
import { RedTeam } from '@/features/redteam/RedTeam';
import { VideoSlot } from '@/features/video/VideoSlot';
import { Faq } from '@/features/faq/Faq';
import { Footer } from '@/features/shell/Footer';
import { COPY } from '@/data/copy';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-text relative">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#141414] focus:text-[#2EF27A] focus:border focus:border-[#2EF27A] focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#2EF27A]"
      >
        Skip to content
      </a>
      <SectionProgress />
      <Header />
      <main id="main-content" className="flex-1 outline-none" tabIndex={-1}>
        <Hero />
        <JudgeStrip />

        {/* Mission Statement with Word-by-Word Scroll Reveal */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto text-center">
          <div className="section-label mb-4">[ MISSION ]</div>
          <ScrollReveal
            text={COPY.hero.subhead}
            className="text-xl sm:text-2xl md:text-3xl font-serif text-text leading-relaxed tracking-tight"
          />
        </section>

        <Simulator />
        <RunItYourself />
        <Architecture />
        <ArchitectureDiagram />
        <GraphSection />
        <AccountSwitchingIllustration />
        <Gates />
        <GemmaFacts />
        <Safety />
        <RedTeam />
        <VideoSlot />
        <Faq />
      </main>
      <Footer />
    </div>
  );
};

export default App;
