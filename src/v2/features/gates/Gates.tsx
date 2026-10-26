import React from 'react';
import { Container } from '@/v2/ui/Container';
import { Eyebrow } from '@/v2/ui/Eyebrow';
import { SerifItalic } from '@/v2/ui/SerifItalic';
import { COPY_V2 } from '@/v2/data/copy.v2';
import { gatesList, verificationSummary } from '@/v2/data/adapters';
import { useReducedMotion } from '@/v2/ui/useReducedMotion';
import {
  ShieldAlert,
  KeyRound,
  HelpCircle,
  Terminal,
  RefreshCw,
  Compass,
  Code2,
  Cpu,
  AlertCircle,
} from 'lucide-react';

export const Gates: React.FC = () => {
  const gates = gatesList();
  const summary = verificationSummary();
  const reducedMotion = useReducedMotion();

  const getGateIcon = (icon: string, id: string) => {
    // Amber accent (--v2-warning) is used ONLY for human-attention moments
    const isHumanAttention =
      id === 'gate-auth-captcha' ||
      id === 'gate-missing-credentials' ||
      id === 'gate-ambiguous-requirement';

    const colorClass = isHumanAttention
      ? 'text-[var(--v2-warning)]'
      : 'text-[var(--v2-accent)]';

    switch (icon) {
      case 'ShieldAlert':
        return <ShieldAlert className={`w-5 h-5 ${colorClass}`} aria-hidden="true" />;
      case 'KeyRound':
        return <KeyRound className={`w-5 h-5 ${colorClass}`} aria-hidden="true" />;
      case 'HelpCircle':
        return <HelpCircle className={`w-5 h-5 ${colorClass}`} aria-hidden="true" />;
      case 'Terminal':
        return <Terminal className={`w-5 h-5 ${colorClass}`} aria-hidden="true" />;
      case 'RefreshCw':
        return <RefreshCw className={`w-5 h-5 ${colorClass}`} aria-hidden="true" />;
      case 'Compass':
        return <Compass className={`w-5 h-5 ${colorClass}`} aria-hidden="true" />;
      default:
        return <AlertCircle className={`w-5 h-5 ${colorClass}`} aria-hidden="true" />;
    }
  };

  return (
    <div className="w-full py-16 sm:py-24">
      <Container>
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <Eyebrow label={COPY_V2.gates.eyebrow} className="mb-4" />
          <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-[var(--v2-headline)] tracking-tight mb-4">
            {COPY_V2.gates.title.plain}
            <SerifItalic>{COPY_V2.gates.title.italic}</SerifItalic>
            {COPY_V2.gates.title.after}
          </h2>
          <p className="font-body text-base sm:text-lg text-[var(--v2-muted)] leading-relaxed">
            {COPY_V2.gates.paragraph}
          </p>
        </div>

        {/* 3x2 Grid of Dark Policy Gate Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {gates.map((gate) => {
            const isEnforcedInCode = gate.enforcement === 'code';
            const isHumanAttention =
              gate.id === 'gate-auth-captcha' ||
              gate.id === 'gate-missing-credentials' ||
              gate.id === 'gate-ambiguous-requirement';

            return (
              <div
                key={gate.id}
                className={`flex flex-col justify-between rounded-[var(--v2-radius-card)] p-6 sm:p-7 bg-[var(--v2-card)] border border-[var(--v2-line)] shadow-lg ${
                  reducedMotion
                    ? ''
                    : 'hover:-translate-y-1 transition-transform duration-200'
                }`}
              >
                <div>
                  {/* Top Bar: Icon Container + Enforcement Badge */}
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isHumanAttention
                          ? 'bg-[var(--v2-warning)]/10 border border-[var(--v2-warning)]/20'
                          : 'bg-white/[0.05] border border-[var(--v2-line)]'
                      }`}
                    >
                      {getGateIcon(gate.icon, gate.id)}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1 rounded-full border ${
                        isEnforcedInCode
                          ? 'border-[var(--v2-accent)]/30 bg-[var(--v2-accent)]/10 text-[var(--v2-accent)]'
                          : 'border-[var(--v2-line)] bg-white/[0.05] text-[var(--v2-muted)]'
                      }`}
                    >
                      {isEnforcedInCode ? (
                        <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>
                        {isEnforcedInCode ? 'Enforced in code' : 'Judged by the model'}
                      </span>
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-semibold text-lg sm:text-xl text-[var(--v2-headline)] mb-3 tracking-tight">
                    {gate.title}
                  </h3>

                  {/* Detects */}
                  <p className="font-body text-xs sm:text-sm text-[var(--v2-muted)] leading-relaxed mb-5">
                    <strong className="text-[var(--v2-text)] font-medium">Detects: </strong>
                    {gate.detects}
                  </p>
                </div>

                {/* Action - Bottom Anchored */}
                <div className="pt-4 border-t border-[var(--v2-line)] font-body text-xs sm:text-sm text-[var(--v2-muted)] leading-relaxed">
                  <strong className="text-[var(--v2-text)] font-medium">Action: </strong>
                  {gate.action}
                </div>
              </div>
            );
          })}
        </div>

        {/* Verification Footnote if present */}
        {summary && (
          <div className="mt-8 pt-6 border-t border-[var(--v2-line)] text-xs font-mono text-[var(--v2-muted)] flex items-center gap-2.5">
            <span
              className="w-2 h-2 rounded-full bg-[var(--v2-accent)] shrink-0"
              aria-hidden="true"
            />
            <span>{summary}</span>
          </div>
        )}
      </Container>
    </div>
  );
};
