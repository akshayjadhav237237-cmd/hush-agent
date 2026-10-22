import React, { useState } from 'react';
import { RefreshCw, PlayCircle, Terminal, HelpCircle } from 'lucide-react';

interface ReplayNotAvailableProps {
  onRefresh: () => Promise<void> | void;
}

export const ReplayNotAvailable: React.FC<ReplayNotAvailableProps> = ({
  onRefresh,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="w-full border border-border rounded-[14px] bg-surface p-8 sm:p-12 flex flex-col items-center justify-center text-center gap-6 shadow-sm">
      <div className="w-12 h-12 rounded-full border border-border bg-surface-2 flex items-center justify-center text-text-muted">
        <PlayCircle className="w-6 h-6 stroke-[1.5]" />
      </div>

      <div className="flex flex-col gap-2 max-w-lg">
        <div className="inline-flex items-center justify-center gap-1.5 mx-auto px-2.5 py-1 rounded-[10px] border border-border bg-surface-2 text-xs font-mono text-text-muted">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Execution Replay Offline</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-serif text-text tracking-tight">
          Replay not available yet
        </h3>

        <p className="text-sm text-text-muted leading-relaxed">
          Run the demo in <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-surface-2 border border-border text-text">agent/</code> and export using <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-surface-2 border border-border text-text">export_replay.py</code> to view execution events here.
        </p>
      </div>

      {/* Terminal export guide */}
      <div className="w-full max-w-md bg-surface-2 border border-border rounded-[10px] p-4 text-left font-mono text-xs text-text-muted space-y-2">
        <div className="flex items-center gap-2 pb-2 border-b border-border text-text font-semibold">
          <Terminal className="w-3.5 h-3.5" />
          <span>Quick Export Guide</span>
        </div>
        <div className="space-y-1 text-text select-all">
          <p className="text-text-muted"># 1. Run agent in demo mode</p>
          <p className="font-mono text-accent">cd agent && python orchestrator.py "build app" --demo</p>
          <p className="text-text-muted pt-1"># 2. Export sanitized replay</p>
          <p className="font-mono text-accent">python export_replay.py latest</p>
          <p className="text-text-muted pt-1"># 3. Place replay in public web root</p>
          <p className="font-mono text-accent">cp runs/&lt;run_id&gt;/replay.json ../public/replay.json</p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] border border-border bg-surface hover:bg-surface-2 text-text text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span>{isRefreshing ? 'Checking for replay...' : 'Check for replay.json'}</span>
      </button>
    </div>
  );
};
