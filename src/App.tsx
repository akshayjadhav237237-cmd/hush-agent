import React from 'react';
import { Header } from '@/features/shell/Header';
import { Hero } from '@/features/shell/Hero';
import { Mission } from '@/features/mission/Mission';
import { Simulator } from '@/features/simulator/Simulator';
import { RunItYourself } from '@/features/run-it-yourself/RunItYourself';
import { Architecture } from '@/features/architecture/Architecture';
import { GraphSection } from '@/features/graph/GraphSection';
import { AccountSwitchingIllustration } from '@/features/account-switching/AccountSwitchingIllustration';
import { Gates } from '@/features/gates/Gates';
import { GemmaFacts } from '@/features/gemma/GemmaFacts';
import { Safety } from '@/features/safety/Safety';
import { VideoSlot } from '@/features/video/VideoSlot';
import { Faq } from '@/features/faq/Faq';
import { Footer } from '@/features/shell/Footer';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      <Header />
      <main className="flex-1">
        <Hero />
        <Mission />
        <Simulator />
        <RunItYourself />
        <Architecture />
        <GraphSection />
        <AccountSwitchingIllustration />
        <Gates />
        <GemmaFacts />
        <Safety />
        <VideoSlot />
        <Faq />
      </main>
      <Footer />
    </div>
  );
};

export default App;
