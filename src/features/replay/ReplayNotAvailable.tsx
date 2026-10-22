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
    <div className="w-full border border-white/[0.06] rounded-[24px] bg-[#141414] p-8 sm:p-12 flex flex-col items-center justify-center text-center gap-6 shadow-sm">
      <div className="w-14 h-14 rounded-full border border-white/[0.06] bg-white/[0.04] flex items-center justify-center text-[#F5F0E8]/45">
        <PlayCircle className="w-7 h-7 stroke-[1.5]" />
      </div>

      <div className="flex flex-col gap-2 max-w-lg">
        <div className="inline-flex items-center justify-center gap-1.5 mx-auto px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.04] text-xs font-mono text-[#F5F0E8]/45">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Execution Replay Offline</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-sans font-bold text-[#F0FFE8] tracking-tight">
          Replay not available yet
        </h3>

        <p className="text-sm text-[#F5F0E8]/60 leading-relaxed font-sans">
          Run the demo in <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[#22FF6E]">agent/</code> and export using <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[#22FF6E]">export_replay.py</code> to view execution events here.
        </p>
      </div>

      {/* Terminal export guide */}
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/[0.06] rounded-[16px] p-5 text-left font-mono text-xs text-[#F5F0E8]/60 space-y-2.5">
        <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06] text-[#F0FFE8] font-semibold">
          <Terminal className="w-3.5 h-3.5 text-[#22FF6E]" />
          <span>Quick Export Guide</span>
        </div>
        <div className="space-y-1.5 text-[#F5F0E8] select-all">
          <p className="text-[#F5F0E8]/40"># 1. Run agent in demo mode</p>
          <p className="font-mono text-[#22FF6E]">cd agent &amp;&amp; python orchestrator.py &quot;build app&quot; --demo</p>
          <p className="text-[#F5F0E8]/40 pt-1"># 2. Export sanitized replay</p>
          <p className="font-mono text-[#22FF6E]">python export_replay.py latest</p>
          <p className="text-[#F5F0E8]/40 pt-1"># 3. Place replay in public web root</p>
          <p className="font-mono text-[#22FF6E]">cp runs/&lt;run_id&gt;/replay.json ../public/replay.json</p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[12px] border border-white/[0.06] bg-white/[0.04] hover:bg-white/10 text-[#F5F0E8] hover:border-[#22FF6E]/30 text-xs sm:text-sm font-mono font-medium transition-colors cursor-pointer disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 text-[#22FF6E] ${isRefreshing ? 'animate-spin' : ''}`} />
        <span>{isRefreshing ? 'Checking for replay...' : 'Check for replay.json'}</span>
      </button>
    </div>
  );
};
