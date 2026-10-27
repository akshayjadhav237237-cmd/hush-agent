import React from 'react';
import { Hero } from '@/v2/features/hero/Hero';
import { Manifesto } from '@/v2/features/manifesto/Manifesto';
import { Bento } from '@/v2/features/bento/Bento';
import { How } from '@/v2/features/how/How';
import { Gates } from '@/v2/features/gates/Gates';
import { Compare } from '@/v2/features/compare/Compare';
import { Stats } from '@/v2/features/stats/Stats';
import { Faq } from '@/v2/features/faq/Faq';
import { Footer } from '@/v2/features/footer/Footer';
import { Section } from '@/v2/ui/Section';

export const App: React.FC = () => {
  return (
    <div className="v2 min-h-screen bg-black v2-text-primary antialiased selection:bg-[var(--v2-accent)]/20 selection:text-[var(--v2-headline)] relative">
      
      <main>
        {/* 1. Hero */}
        <Hero />

        {/* 2. Manifesto */}
        <Section id="manifesto">
          <Manifesto />
        </Section>

        {/* 3. Bento */}
        <Section id="bento">
          <Bento />
        </Section>

        {/* 4. How */}
        <Section id="how">
          <How />
        </Section>

        {/* 5. Gates */}
        <Section id="gates">
          <Gates />
        </Section>

        {/* 6. Compare */}
        <Section id="compare">
          <Compare />
        </Section>

        {/* 8. Stats */}
        <Section id="stats">
          <Stats />
        </Section>

        {/* 9. FAQ */}
        <Section id="faq">
          <Faq />
        </Section>
      </main>

      {/* 10. Footer */}
      <Footer />
    </div>
  );
};

export default App;
