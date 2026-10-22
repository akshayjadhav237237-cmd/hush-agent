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
    <div className="rounded-[24px] border border-white/[0.06] bg-[#141414] overflow-hidden my-6">
      {/* Table Header and Search Bar */}
      <div className="p-5 sm:p-6 border-b border-white/[0.06] bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#22FF6E]" strokeWidth={1.5} aria-hidden="true" />
            <h4 className="text-base sm:text-lg font-sans font-bold text-[#F0FFE8] tracking-tight">
              CLI Options Reference
            </h4>
          </div>
          <p className="text-xs text-[#F5F0E8]/45 mt-1 font-mono">
            Command-line arguments extracted directly from <code className="text-[#22FF6E]">agent/core/cli.py</code>
          </p>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px] sm:w-72">
          <Search className="w-3.5 h-3.5 text-[#F5F0E8]/45 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter flags (e.g. demo, resume)..."
            aria-label="Filter CLI options"
            className="w-full pl-9 pr-3.5 py-2 text-xs font-mono rounded-[12px] bg-[#0e0e0e] border border-white/[0.06] text-[#F5F0E8] placeholder:text-[#F5F0E8]/35 outline-none focus:ring-1 focus:ring-[#22FF6E] focus:border-[#22FF6E]"
          />
        </div>
      </div>

      {/* Desktop / Tablet Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.01] text-[#F5F0E8]/45 font-mono uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-5 font-medium w-[290px]">Option &amp; Syntax</th>
              <th className="py-3.5 px-5 font-medium w-[120px]">Type</th>
              <th className="py-3.5 px-5 font-medium w-[130px]">Default</th>
              <th className="py-3.5 px-5 font-medium">Description &amp; Behavior</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filteredOptions.map((opt) => {
              const isCopied = copiedFlag === opt.syntax;
              return (
                <tr
                  key={opt.flag}
                  className="hover:bg-white/[0.02] transition-colors group"
                >
                  {/* Syntax & Copy Button */}
                  <td className="py-3.5 px-5 font-mono">
                    <div className="flex items-center gap-2">
                      <code className="text-[#F0FFE8] font-semibold px-2.5 py-1 rounded-[8px] bg-[#0e0e0e] border border-white/[0.06]">
                        {opt.syntax}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopyFlag(opt.syntax)}
                        aria-label={`Copy ${opt.syntax} to clipboard`}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-[8px] text-[#F5F0E8]/45 hover:text-[#F5F0E8] hover:bg-white/10 border border-transparent hover:border-white/[0.06] transition-all cursor-pointer"
                        title="Copy flag"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-[#22FF6E]" strokeWidth={2} />
                        ) : (
                          <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-3.5 px-5 font-mono">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/[0.04] text-[#F5F0E8]/60 border border-white/[0.06]">
                      {opt.argType}
                    </span>
                  </td>

                  {/* Default */}
                  <td className="py-3.5 px-5 font-mono text-[#F5F0E8]/45">
                    <code className="text-[#F5F0E8]/50 text-[11px]">
                      {opt.defaultValue}
                    </code>
                  </td>

                  {/* Description */}
                  <td className="py-3.5 px-5 text-[#F5F0E8]/70 leading-relaxed font-sans text-xs">
                    {opt.description}
                  </td>
                </tr>
              );
            })}
            {filteredOptions.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[#F5F0E8]/45 font-mono text-xs">
                  No CLI options match &quot;{searchTerm}&quot;
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-white/[0.04]">
        {filteredOptions.map((opt) => {
          const isCopied = copiedFlag === opt.syntax;
          return (
            <div key={opt.flag} className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs font-mono font-semibold text-[#F0FFE8] px-2 py-0.5 rounded-[6px] bg-[#0e0e0e] border border-white/[0.06]">
                  {opt.syntax}
                </code>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] text-[#F5F0E8]/60 border border-white/[0.06]">
                    {opt.argType}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyFlag(opt.syntax)}
                    aria-label={`Copy ${opt.syntax}`}
                    className="p-1 rounded text-[#F5F0E8]/60 hover:text-[#F5F0E8] bg-white/[0.04] border border-white/[0.06] cursor-pointer"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-[#22FF6E]" strokeWidth={2} />
                    ) : (
                      <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-xs text-[#F5F0E8]/70 leading-relaxed font-sans">
                {opt.description}
              </p>
              <div className="text-[11px] font-mono text-[#F5F0E8]/45">
                Default: <code className="text-[#F0FFE8]">{opt.defaultValue}</code>
              </div>
            </div>
          );
        })}
        {filteredOptions.length === 0 && (
          <div className="py-6 text-center text-[#F5F0E8]/45 font-mono text-xs">
            No CLI options match &quot;{searchTerm}&quot;
          </div>
        )}
      </div>

      {/* Footer Banner */}
      <div className="p-4 border-t border-white/[0.06] bg-white/[0.02] text-[11px] font-mono text-[#F5F0E8]/45 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#22FF6E]" strokeWidth={1.5} />
          <span>Usage: python orchestrator.py [OPTIONS] [idea ...]</span>
        </div>
        <span className="hidden sm:inline text-[#F5F0E8]/40">
          Run with -h / --help for complete CLI flag descriptions
        </span>
      </div>
    </div>
  );
};
