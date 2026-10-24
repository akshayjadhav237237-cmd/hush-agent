import React, { useState, useMemo } from 'react';
import { RED_TEAM_RESULTS, RedTeamEntry } from '@/data/redteam';
import {
  Search,
  X,
  AlertTriangle,
  Terminal,
  Filter,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
} from 'lucide-react';

type FilterCategory =
  | 'All'
  | 'Destructive'
  | 'Path Traversal'
  | 'Chaining'
  | 'Injection'
  | 'Blocked Arguments'
  | 'Sensitive Files'
  | 'Allowed';

interface CategoryConfig {
  id: FilterCategory;
  label: string;
  match: (entry: RedTeamEntry) => boolean;
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'All', label: 'All', match: () => true },
  { id: 'Destructive', label: 'Destructive', match: (e) => e.category === 'Destructive' },
  { id: 'Path Traversal', label: 'Path Traversal', match: (e) => e.category === 'Path Traversal' },
  { id: 'Chaining', label: 'Chaining', match: (e) => e.category === 'Command Chaining' },
  { id: 'Injection', label: 'Injection', match: (e) => e.category === 'Shell Injection' },
  { id: 'Blocked Arguments', label: 'Blocked Arguments', match: (e) => e.category === 'Blocked Arguments' },
  { id: 'Sensitive Files', label: 'Sensitive Files', match: (e) => e.category === 'Sensitive Files' },
  { id: 'Allowed', label: 'Allowed', match: (e) => e.category === 'Allowed Commands' },
];

export const RedTeam: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('All');
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const totalCount = RED_TEAM_RESULTS.length;
  const blockedCount = RED_TEAM_RESULTS.filter((r) => r.result === 'BLOCKED').length;
  const allowedCount = RED_TEAM_RESULTS.filter((r) => r.result === 'ALLOWED').length;

  const handleCopy = (cmd: string) => {
    navigator.clipboard?.writeText(cmd);
    setCopiedCommand(cmd);
    setTimeout(() => {
      setCopiedCommand((prev) => (prev === cmd ? null : prev));
    }, 1800);
  };

  const filteredResults = useMemo(() => {
    const currentCategoryConfig = CATEGORIES.find((c) => c.id === activeCategory);
    const categoryFilter = currentCategoryConfig ? currentCategoryConfig.match : () => true;

    const normalizedQuery = searchQuery.trim().toLowerCase();

    return RED_TEAM_RESULTS.filter((entry) => {
      if (!categoryFilter(entry)) return false;

      if (!normalizedQuery) return true;

      const commandMatch = entry.command.toLowerCase().includes(normalizedQuery);
      const reasonMatch = entry.reason.toLowerCase().includes(normalizedQuery);
      const categoryMatch = entry.category.toLowerCase().includes(normalizedQuery);

      return commandMatch || reasonMatch || categoryMatch;
    });
  }, [searchQuery, activeCategory]);

  return (
    <section
      id="red-team"
      aria-labelledby="red-team-heading"
      className="py-20 lg:py-32 border-t border-border bg-bg text-text"
    >
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-medium bg-surface-2 border border-border text-text-muted mb-4 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" aria-hidden="true" />
            <span className="text-text font-semibold">[ RED TEAM ]</span>
            <span className="text-white/20">•</span>
            <span className="text-danger font-medium">Empirical Penetration Audit</span>
          </div>

          <h2
            id="red-team-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-sans tracking-tight text-text font-bold"
          >
            Adversarial{' '}
            <span className="font-serif italic font-normal text-accent">Command Audit.</span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-text-muted leading-relaxed">
            Empirical evaluation of the command allowlist against shell injections, directory escapes,
            administrative binaries, and unauthorized repository operations.
          </p>
        </div>

        {/* Audit Metrics Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="p-4 rounded-xl bg-surface border border-border flex flex-col justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-text-muted">Probes Evaluated</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-mono text-3xl font-bold text-text">{totalCount}</span>
              <span className="text-xs text-text-muted font-mono">cases</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-border flex flex-col justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-text-muted">Blocked Attacks</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-mono text-3xl font-bold text-danger">{blockedCount}</span>
              <span className="text-xs text-danger/80 font-mono">100% caught</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-border flex flex-col justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-text-muted">Allowed Controls</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-mono text-3xl font-bold text-success">{allowedCount}</span>
              <span className="text-xs text-success/80 font-mono">100% permitted</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-border flex flex-col justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-text-muted">Containment Rule</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-mono text-xl sm:text-2xl font-bold text-accent">Zero Escape</span>
              <span className="text-xs text-accent/80 font-mono">verified</span>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-surface rounded-2xl border border-border p-4 sm:p-6 mb-8 space-y-5 shadow-xs">
          {/* Top row: Search input + Results summary counter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-lg">
              <Search
                className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search commands or rejection reasons (e.g. rm -rf, traversal, git, eval)..."
                aria-label="Search red team test commands"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-2 border border-border text-sm text-text placeholder:text-text-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent font-sans transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search input"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text p-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 font-mono text-xs text-text-muted">
              <span>
                Showing <strong className="text-text">{filteredResults.length}</strong> of{' '}
                <strong className="text-text">{totalCount}</strong> tests
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('All');
                  }}
                  className="text-xs text-accent hover:underline cursor-pointer"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>

          {/* Bottom row: Category Filter Chips */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5 font-mono text-xs uppercase tracking-wider text-text-muted">
              <Filter className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} aria-hidden="true" />
              <span>Category Filter</span>
            </div>

            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label="Filter tests by adversarial category"
            >
              {CATEGORIES.map((cat) => {
                const count = RED_TEAM_RESULTS.filter(cat.match).length;
                const isActive = activeCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    aria-pressed={isActive}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      isActive
                        ? 'bg-surface-2 text-text border border-accent/40 shadow-xs font-semibold'
                        : 'bg-surface-2/60 text-text-muted hover:text-text hover:bg-surface-2 border border-border'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        isActive
                          ? 'bg-accent/20 text-accent font-bold'
                          : 'bg-black/30 text-text-muted'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results Table with Horizontal Scrolling Container */}
        <div className="w-full overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-border bg-surface-2/70 text-text-muted font-mono text-xs uppercase tracking-wider">
                <th scope="col" className="py-3 px-4 w-[110px]">
                  Result
                </th>
                <th scope="col" className="py-3 px-4 w-[280px]">
                  Command
                </th>
                <th scope="col" className="py-3 px-4 w-[160px]">
                  Category
                </th>
                <th scope="col" className="py-3 px-4">
                  Evaluated Policy Reason
                </th>
                <th scope="col" className="py-3 px-3 w-[60px] text-center">
                  Copy
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-text-muted font-mono text-sm">
                    No adversarial commands match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredResults.map((entry, idx) => {
                  const isBlocked = entry.result === 'BLOCKED';

                  return (
                    <tr
                      key={`${entry.command}-${idx}`}
                      className={`transition-colors text-sm ${
                        isBlocked
                          ? 'bg-danger/[0.04] hover:bg-danger/[0.08] border-l-4 border-l-danger'
                          : 'bg-success/[0.04] hover:bg-success/[0.08] border-l-4 border-l-success'
                      }`}
                    >
                      {/* Result Badge */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-danger/15 text-danger border border-danger/30">
                            <XCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
                            <span>BLOCKED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-success/15 text-success border border-success/30">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
                            <span>ALLOWED</span>
                          </span>
                        )}
                      </td>

                      {/* Command in Monospace Code */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-start gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-text-muted shrink-0 mt-1" aria-hidden="true" />
                          <code className="font-mono text-xs sm:text-[13px] text-text bg-black/60 px-2.5 py-1 rounded border border-border/80 break-all select-all font-medium leading-relaxed">
                            {entry.command}
                          </code>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-md text-xs font-mono bg-surface-2 text-text-muted border border-border">
                          {entry.category}
                        </span>
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4 align-top">
                        <p
                          className={`font-mono text-xs leading-relaxed ${
                            isBlocked ? 'text-danger/90' : 'text-success/90'
                          }`}
                        >
                          {entry.reason}
                        </p>
                      </td>

                      {/* Copy Action */}
                      <td className="py-3.5 px-3 align-top text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleCopy(entry.command)}
                          title="Copy command to clipboard"
                          aria-label={`Copy command ${entry.command}`}
                          className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
                        >
                          {copiedCommand === entry.command ? (
                            <Check className="w-3.5 h-3.5 text-success" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Plain Security Note Callout */}
        <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-surface border border-border flex items-start gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-text shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-warning" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h3 className="font-mono text-xs uppercase tracking-wider font-semibold text-text">
              Operational Guardrail Notice
            </h3>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              Operational Guardrail Notice: Binaries like python and npm can execute code within their
              runtime; the allowlist confines commands and parameters but is not an operating system sandbox.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RedTeam;
