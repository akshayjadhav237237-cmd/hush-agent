import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, Terminal as TerminalIcon } from 'lucide-react';
import type { Step } from '@/data/types';

interface TerminalProps {
  step: Step;
  stepIndex: number;
  totalSteps: number;
}

function usePrefersReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return reducedMotion;
}

export const Terminal: React.FC<TerminalProps> = ({ step, stepIndex, totalSteps }) => {
  const prefersReduced = usePrefersReducedMotion();
  const [visibleCount, setVisibleCount] = useState<number>(() =>
    prefersReduced ? step.terminal.length : 1
  );
  const [copied, setCopied] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Progressive streaming effect for new step
  useEffect(() => {
    if (prefersReduced) {
      setVisibleCount(step.terminal.length);
      return;
    }

    setVisibleCount(1);
    if (step.terminal.length <= 1) return;

    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev < step.terminal.length) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [step.id, step.terminal.length, prefersReduced]);

  // Auto-scroll terminal to bottom when new line streams in
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleCount, step.id]);

  const handleCopy = async () => {
    const fullText = step.terminal.join('\n');
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const isStreamingComplete = visibleCount >= step.terminal.length;

  return (
    <section
      aria-label="Terminal output log"
      className="flex flex-col w-full rounded-[10px] border border-border bg-surface-2 overflow-hidden"
    >
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border select-none">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} aria-hidden="true" />
          <span className="font-mono text-xs text-text-muted">execution.log</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-text-muted">
            Step {stepIndex + 1}/{totalSteps}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="border border-border rounded-[10px] bg-transparent text-xs hover:bg-surface transition-colors inline-flex items-center gap-1.5 px-2.5 py-1 text-text"
            title="Copy terminal output"
            aria-label={copied ? "Output copied to clipboard" : "Copy terminal output"}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-success" strokeWidth={1.5} aria-hidden="true" />
                <span className="text-[11px] font-mono text-success">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} aria-hidden="true" />
                <span className="text-[11px] font-mono text-text-muted">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Terminal Content Body */}
      <div
        ref={containerRef}
        role="log"
        aria-live="polite"
        aria-atomic="false"
        tabIndex={0}
        className="p-4 font-mono text-[13px] leading-relaxed overflow-x-auto overflow-y-auto max-h-[380px] min-h-[260px] text-text space-y-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
      >
        {step.terminal.slice(0, visibleCount).map((line, idx) => {
          const isCommand = line.startsWith('$');
          const isSecurityBlocked = line.includes('SECURITY GATE BLOCKED');
          const isGateAttention = line.includes('GATE TRIGGERED') || line.includes('NEEDS_HUMAN') || line.includes('[Reason]') || line.includes('[Action]') || line.includes('[Operator Alert]');
          const isSuccess = line.includes('SUCCESS') || line.includes('succeeded') || line.includes('certified');

          let lineClass = 'text-text';
          if (isSecurityBlocked) {
            lineClass = 'text-danger font-medium';
          } else if (isGateAttention) {
            // Amber used strictly for human-attention moments
            lineClass = 'text-warning font-medium';
          } else if (isCommand) {
            lineClass = 'text-accent font-medium';
          } else if (isSuccess) {
            lineClass = 'text-success font-medium';
          }

          return (
            <div key={`${step.id}-line-${idx}`} className="flex items-start gap-2.5 leading-relaxed">
              <span className="text-text-muted/60 select-none text-xs w-6 shrink-0 text-right font-mono" aria-hidden="true">
                {idx + 1}
              </span>
              <span className={`break-words flex-1 ${lineClass}`}>
                {line}
              </span>
            </div>
          );
        })}

        {/* Streaming Cursor */}
        {!isStreamingComplete && !prefersReduced && (
          <div className="flex items-center gap-2 pl-8 pt-0.5" aria-hidden="true">
            <span className="inline-block w-1.5 h-3.5 bg-text-muted animate-pulse" />
          </div>
        )}
      </div>
    </section>
  );
};
