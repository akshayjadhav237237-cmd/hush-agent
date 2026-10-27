import React from 'react';
import { Container } from '@/v2/ui/Container';
import { Eyebrow } from '@/v2/ui/Eyebrow';
import { SerifItalic } from '@/v2/ui/SerifItalic';
import { COPY_V2 } from '@/v2/data/copy.v2';
import { FileCode2 } from 'lucide-react';

export const Compare: React.FC = () => {
  return (
    <div className="w-full py-16 sm:py-24">
      <Container>
        {/* Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <Eyebrow label={COPY_V2.compare.eyebrow} className="mb-4" />
          <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-[var(--v2-headline)] tracking-tight mb-4">
            {COPY_V2.compare.title.plain}
            <SerifItalic>{COPY_V2.compare.title.italic}</SerifItalic>
          </h2>
          <p className="font-body text-base sm:text-lg text-[var(--v2-muted)] leading-relaxed">
            {COPY_V2.compare.paragraph}
          </p>
        </div>

        {/* Diff Window Card */}
        <div className="w-full rounded-[var(--v2-radius-card)] bg-[var(--v2-card)] border border-[var(--v2-line)] shadow-2xl overflow-hidden font-mono">
          {/* Header bar: Mono file header 'hush.workflow.diff' */}
          <div className="flex items-center justify-between px-4 sm:px-7 py-3.5 sm:py-4 bg-[var(--v2-card-2)] border-b border-[var(--v2-line)]">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex items-center gap-1.5 opacity-40 shrink-0" aria-hidden="true">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white/20" />
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white/20" />
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white/20" />
              </span>
              <span className="inline-flex items-center gap-2 text-xs sm:text-sm text-[var(--v2-text)] font-medium font-mono min-w-0 truncate">
                <FileCode2 className="w-4 h-4 text-[var(--v2-link)] shrink-0" aria-hidden="true" />
                <span className="truncate">{COPY_V2.compare.fileHeader}</span>
              </span>
            </div>
            <span className="text-[11px] uppercase tracking-widest text-[var(--v2-muted)] hidden sm:inline-block shrink-0 pl-2">
              DIFF VIEW
            </span>
          </div>

          {/* Diff Groups */}
          <div className="divide-y divide-[var(--v2-line)]">
            {COPY_V2.compare.groups.slice(0, 3).map((group) => (
              <div key={group.label} className="p-4 sm:p-6 lg:p-7">
                {/* Group Label */}
                <div className="text-xs tracking-wider text-[var(--v2-muted)] uppercase mb-3 flex items-center gap-2 font-mono font-medium">
                  <span>{group.label}</span>
                </div>

                {/* Rows container */}
                <div className="space-y-2.5 text-xs sm:text-sm">
                  {/* Deleted / Manual Row: red '-' row */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3.5 p-3.5 sm:p-4 rounded-xl bg-[var(--v2-diff-del-bg)] border border-[var(--v2-diff-del)]/25 text-[var(--v2-diff-del)]">
                    <span
                      aria-label="Manual workflow"
                      className="self-start shrink-0 inline-flex items-center gap-1 font-mono font-bold select-none px-2 py-0.5 rounded text-xs bg-[var(--v2-diff-del)]/15 text-[var(--v2-diff-del)] border border-[var(--v2-diff-del)]/20"
                    >
                      <span aria-hidden="true" className="font-black text-sm leading-none">-</span>
                      <span>MANUAL</span>
                    </span>
                    <span className="leading-relaxed font-body text-[var(--v2-text)]/80 min-w-0 flex-1 break-words">
                      {group.del}
                    </span>
                  </div>

                  {/* Added / Hush Row: green '+' row */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3.5 p-3.5 sm:p-4 rounded-xl bg-[var(--v2-diff-add-bg)] border border-[var(--v2-diff-add)]/25 text-[var(--v2-diff-add)]">
                    <span
                      aria-label="Hush automated workflow"
                      className="self-start shrink-0 inline-flex items-center gap-1 font-mono font-bold select-none px-2 py-0.5 rounded text-xs bg-[var(--v2-diff-add)]/20 text-[var(--v2-diff-add)] border border-[var(--v2-diff-add)]/20"
                    >
                      <span aria-hidden="true" className="font-black text-sm leading-none">+</span>
                      <span>HUSH</span>
                    </span>
                    <span className="leading-relaxed font-body text-[var(--v2-headline)] font-medium min-w-0 flex-1 break-words">
                      {group.add}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
};
