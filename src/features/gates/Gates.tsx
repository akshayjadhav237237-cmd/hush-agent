import React from 'react';
import { ATTENTION_GATES } from '@/data/gates';
import { GateCard } from './GateCard';
import { FatigueCallout } from './FatigueCallout';
import { ShieldCheck } from 'lucide-react';

export const Gates: React.FC = () => {
  return (
    <section
      id="gates"
      aria-labelledby="gates-heading"
      className="py-20 lg:py-32 border-t border-[rgba(255,255,255,0.06)] bg-[#000000] text-[#F5F0E8]"
    >
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-[rgba(245,240,232,0.45)] mb-4">
            [ ATTENTION GATES ]
          </div>
          <h2
            id="gates-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-[#F0FFE8] leading-[1.15]"
          >
            When Progress <span className="font-serif italic font-normal text-[#22FF6E]">Demands</span> Human Attention.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[rgba(245,240,232,0.55)] leading-relaxed">
            Autonomous progress does not require constant confirmation. Hush runs silently across verified safe states. It escalates to human review only when a policy gate trips.
          </p>
        </div>

        {/* Layout: Tall hero-style feature card on the left alongside grid of dark #141414 cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Tall hero-style feature card */}
          <div className="lg:col-span-4 flex flex-col justify-between bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-7 sm:p-8 relative overflow-hidden group">
            {/* Ambient accent glow */}
            <div
              className="pointer-events-none absolute -top-24 -left-24 w-64 h-64 bg-[#22FF6E]/[0.06] rounded-full blur-3xl"
              aria-hidden="true"
            />

            <div>
              {/* Mono label */}
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-[rgba(245,240,232,0.45)] mb-3">
                00 // ATTENTION GATE PROTOCOL
              </div>

              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono bg-[#22FF6E]/10 border border-[#22FF6E]/20 text-[#22FF6E] mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22FF6E] animate-pulse" aria-hidden="true" />
                <span>ACTIVE SUPERVISOR</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold font-display text-[#F0FFE8] tracking-tight leading-snug">
                Zero Prompt Noise by Default.
              </h3>

              <p className="mt-3 text-xs sm:text-sm text-[rgba(245,240,232,0.6)] leading-relaxed font-sans">
                Standard coding agents trigger constant confirmation fatigue, prompting operators for routine edits until fatal mistakes slip through. Hush reverses this: silent execution across verified safe states, suspending execution only when a policy boundary is tripped.
              </p>

              {/* Graphic / Visual Architecture representation */}
              <div className="my-6 p-4 rounded-[16px] bg-[#0A0A0A] border border-[rgba(255,255,255,0.04)] space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-[11px] text-[rgba(245,240,232,0.45)] border-b border-[rgba(255,255,255,0.04)] pb-2">
                  <span>EXECUTION STREAM</span>
                  <span className="text-[#22FF6E] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22FF6E]" aria-hidden="true" />
                    <span>SILENT BY DEFAULT</span>
                  </span>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[rgba(245,240,232,0.6)]">Active Gates</span>
                    <span className="text-[#F5F0E8] font-semibold">{ATTENTION_GATES.length} Total</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[rgba(245,240,232,0.6)]">Code-Enforced (OS/Sandbox)</span>
                    <span className="text-[#22FF6E] font-semibold">2 Non-bypassable</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[rgba(245,240,232,0.6)]">Model-Judged (Gemma 4)</span>
                    <span className="text-[rgba(245,240,232,0.85)] font-semibold">4 Monitored</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[rgba(255,255,255,0.04)] text-[10px] text-[rgba(245,240,232,0.45)] flex items-center justify-between">
                  <span>INTERRUPT CRITERIA</span>
                  <span className="text-warning">POLICY TRIP ONLY</span>
                </div>
              </div>
            </div>

            {/* Serif caption at bottom-left */}
            <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.06)]">
              <p className="font-serif italic text-base sm:text-lg text-[#F5F0E8]/90 leading-snug">
                &ldquo;Progress continues uninterrupted until safety, identity, or critical ambiguity requires human judgment.&rdquo;
              </p>
              <div className="mt-3 font-mono text-[11px] text-[rgba(245,240,232,0.45)] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#22FF6E]" strokeWidth={1.5} aria-hidden="true" />
                <span>Continuous Sandbox Enforcement</span>
              </div>
            </div>
          </div>

          {/* Right: Grid of dark #141414 cards */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {ATTENTION_GATES.map((gate, index) => (
              <GateCard key={gate.id} gate={gate} index={index} />
            ))}
          </div>
        </div>

        {/* Footnote */}
        <p className="mt-10 text-center text-xs text-[rgba(245,240,232,0.45)] font-mono">
          Code-enforced gates cannot be talked around by the model. Model-judged gates can be wrong, which is why the forensic audit log is on the roadmap.
        </p>

        {/* Fatigue Callout for in-depth comparison */}
        <div className="mt-12">
          <FatigueCallout />
        </div>
      </div>
    </section>
  );
};

export default Gates;
