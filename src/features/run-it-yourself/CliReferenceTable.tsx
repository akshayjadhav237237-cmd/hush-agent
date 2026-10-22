import React, { useState, useMemo } from 'react';
import { Terminal, Copy, Check, Search, SlidersHorizontal } from 'lucide-react';

export interface CliOption {
  flag: string;
  syntax: string;
  argType: 'flag' | 'string' | 'number' | 'optional_string' | 'positional';
  defaultValue: string;
  description: string;
  category: 'simulation' | 'execution' | 'safety' | 'audit';
}

export const CLI_OPTIONS: readonly CliOption[] = [
  {
    flag: '--demo',
    syntax: '--demo',
    argType: 'flag',
    defaultValue: 'false',
    description: 'Run against a simulated mock desktop without moving real mouse/keyboard.',
    category: 'simulation',
  },
  {
    flag: '--demo-limit',
    syntax: '--demo-limit',
    argType: 'flag',
    defaultValue: 'false',
    description: 'Trigger a simulated usage limit during demo mode.',
    category: 'simulation',
  },
  {
    flag: '--demo-answer',
    syntax: '--demo-answer <TEXT>',
    argType: 'string',
    defaultValue: 'None',
    description: 'Pre-configured human answer for NEEDS_HUMAN prompt in demo mode.',
    category: 'simulation',
  },
  {
    flag: '--resume',
    syntax: '--resume [RUN_ID]',
    argType: 'optional_string',
    defaultValue: 'latest',
    description: 'Resume an interrupted run (defaults to latest run if no ID specified).',
    category: 'execution',
  },
  {
    flag: '--max-steps',
    syntax: '--max-steps <N>',
    argType: 'number',
    defaultValue: '80',
    description: 'Maximum orchestrator loop steps before exiting (default: 80).',
    category: 'execution',
  },
  {
    flag: '--account-switch',
    syntax: '--account-switch',
    argType: 'flag',
    defaultValue: 'false',
    description: 'Enable switching between Chrome profiles upon reaching usage limits.',
    category: 'safety',
  },
  {
    flag: '--i-accept-account-switch-terms',
    syntax: '--i-accept-account-switch-terms',
    argType: 'flag',
    defaultValue: 'false',
    description: 'Acknowledge caution terms and risks for automated Chrome account switching.',
    category: 'safety',
  },
  {
    flag: '--log-text',
    syntax: '--log-text',
    argType: 'flag',
    defaultValue: 'false',
    description: 'Include raw paste/clipboard text in audit logs instead of hash/length.',
    category: 'audit',
  },
  {
    flag: 'idea',
    syntax: '[idea ...]',
    argType: 'positional',
    defaultValue: 'required (or --resume)',
    description: 'Description of the project/app to build autonomously.',
    category: 'execution',
  },
];

export const CliReferenceTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedFlag, setCopiedFlag] = useState<string | null>(null);

  const handleCopyFlag = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFlag(text);
    setTimeout(() => {
      setCopiedFlag(null);
    }, 1800);
  };

  const filteredOptions = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return CLI_OPTIONS;
    return CLI_OPTIONS.filter(
      (opt) =>
        opt.flag.toLowerCase().includes(q) ||
        opt.syntax.toLowerCase().includes(q) ||
        opt.description.toLowerCase().includes(q) ||
        opt.category.toLowerCase().includes(q)
    );
  }, [searchTerm]);

  return (
    <div className="rounded-[14px] border border-border bg-surface overflow-hidden my-6">
      {/* Table Header and Search Bar */}
      <div className="p-4 sm:p-5 border-b border-border bg-surface-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-accent" strokeWidth={1.5} aria-hidden="true" />
            <h4 className="text-sm sm:text-base font-semibold text-text tracking-tight">
              CLI Options Reference
            </h4>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Command-line arguments extracted directly from <code className="font-mono text-text">agent/core/cli.py</code>
          </p>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px] sm:w-64">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter flags (e.g. demo, resume)..."
            aria-label="Filter CLI options"
            className="w-full pl-8 pr-3 py-1.5 text-xs font-mono rounded-[8px] bg-surface border border-border text-text placeholder:text-text-muted/60 outline-none focus:ring-1 focus:ring-accent focus:border-accent"
          />
        </div>
      </div>

      {/* Desktop / Tablet Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border/80 bg-surface text-text-muted font-mono uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 font-medium w-[280px]">Option &amp; Syntax</th>
              <th className="py-3 px-4 font-medium w-[120px]">Type</th>
              <th className="py-3 px-4 font-medium w-[130px]">Default</th>
              <th className="py-3 px-4 font-medium">Description &amp; Behavior</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredOptions.map((opt) => {
              const isCopied = copiedFlag === opt.syntax;
              return (
                <tr
                  key={opt.flag}
                  className="hover:bg-surface-2/60 transition-colors group"
                >
                  {/* Syntax & Copy Button */}
                  <td className="py-3 px-4 font-mono">
                    <div className="flex items-center gap-2">
                      <code className="text-text font-semibold px-2 py-0.5 rounded bg-surface-2 border border-border">
                        {opt.syntax}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopyFlag(opt.syntax)}
                        aria-label={`Copy ${opt.syntax} to clipboard`}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded text-text-muted hover:text-text hover:bg-surface border border-transparent hover:border-border transition-all"
                        title="Copy flag"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-success" strokeWidth={2} />
                        ) : (
                          <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-3 px-4 font-mono">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-2 text-text-muted border border-border/70">
                      {opt.argType}
                    </span>
                  </td>

                  {/* Default */}
                  <td className="py-3 px-4 font-mono text-text-muted">
                    <code className="text-text-muted text-[11px]">
                      {opt.defaultValue}
                    </code>
                  </td>

                  {/* Description */}
                  <td className="py-3 px-4 text-text-muted leading-relaxed font-sans text-xs">
                    {opt.description}
                  </td>
                </tr>
              );
            })}
            {filteredOptions.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-text-muted font-mono text-xs">
                  No CLI options match "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-border/60">
        {filteredOptions.map((opt) => {
          const isCopied = copiedFlag === opt.syntax;
          return (
            <div key={opt.flag} className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs font-mono font-semibold text-text px-2 py-0.5 rounded bg-surface-2 border border-border">
                  {opt.syntax}
                </code>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-2 text-text-muted border border-border">
                    {opt.argType}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyFlag(opt.syntax)}
                    aria-label={`Copy ${opt.syntax}`}
                    className="p-1 rounded text-text-muted hover:text-text bg-surface-2 border border-border"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-success" strokeWidth={2} />
                    ) : (
                      <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                {opt.description}
              </p>
              <div className="text-[11px] font-mono text-text-muted">
                Default: <code className="text-text">{opt.defaultValue}</code>
              </div>
            </div>
          );
        })}
        {filteredOptions.length === 0 && (
          <div className="py-6 text-center text-text-muted font-mono text-xs">
            No CLI options match "{searchTerm}"
          </div>
        )}
      </div>

      {/* Footer Banner */}
      <div className="p-3 border-t border-border bg-surface-2/60 text-[11px] font-mono text-text-muted flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
          <span>Usage: python orchestrator.py [OPTIONS] [idea ...]</span>
        </div>
        <span className="hidden sm:inline text-text-muted/80">
          Run with -h / --help for complete CLI flag descriptions
        </span>
      </div>
    </div>
  );
};
