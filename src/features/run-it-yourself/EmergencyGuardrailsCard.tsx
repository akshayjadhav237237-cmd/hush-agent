import React from 'react';
import { OctagonAlert, CornerDownLeft, ShieldAlert, Cpu, Activity } from 'lucide-react';

export const EmergencyGuardrailsCard: React.FC = () => {
  return (
    <div className="rounded-[24px] border border-white/[0.06] bg-[#141414] p-6 sm:p-7 my-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[12px] bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#22FF6E] shrink-0">
            <OctagonAlert className="w-5 h-5 text-[#22FF6E]" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#F5F0E8]/45 font-medium">
              [ DUAL HARDWARE &amp; OS FAIL-SAFE ENGINE ]
            </span>
            <h4 className="text-base sm:text-lg font-sans font-bold text-[#F0FFE8] tracking-tight">
              Two Independent Kill Mechanisms
            </h4>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#22FF6E]/10 border border-[#22FF6E]/30 text-[#22FF6E] self-start sm:self-auto">
          <ShieldAlert className="w-3.5 h-3.5 text-[#22FF6E]" strokeWidth={1.5} aria-hidden="true" />
          <span>Active in Real Desktop Runs</span>
        </div>
      </div>

      {/* Mechanism Cards Grid */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Mechanism 1: Global Hotkey */}
        <div className="rounded-[18px] bg-[#0e0e0e] border border-white/[0.06] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#22FF6E] shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <span className="text-sm font-sans font-semibold text-[#F0FFE8]">Global Hotkey Interrupt</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[#F5F0E8] font-semibold">
                Exit Code 3
              </span>
            </div>

            <p className="text-xs text-[#F5F0E8]/60 leading-relaxed mb-3.5 font-sans">
              Asynchronous background worker polling Windows <code className="text-[#22FF6E] font-mono">GetAsyncKeyState</code> at 20&nbsp;Hz globally. Intercepts the orchestrator before or during any tool call.
            </p>

            <div className="flex items-center gap-1.5 my-3 py-2.5 px-3 rounded-[12px] bg-[#141414] border border-white/[0.06]">
              <span className="text-xs font-mono text-[#F5F0E8]/45 mr-1">Trigger:</span>
              <kbd className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-xs font-semibold text-[#F0FFE8] shadow-xs">
                Ctrl
              </kbd>
              <span className="text-[#F5F0E8]/45 text-xs font-mono">+</span>
              <kbd className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-xs font-semibold text-[#F0FFE8] shadow-xs">
                Alt
              </kbd>
              <span className="text-[#F5F0E8]/45 text-xs font-mono">+</span>
              <kbd className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-xs font-semibold text-[#22FF6E] shadow-xs">
                K
              </kbd>
            </div>
          </div>

          <div className="pt-3.5 border-t border-white/[0.06] flex flex-col gap-1.5 text-[11px] font-mono text-[#F5F0E8]/45">
            <div className="flex items-center justify-between">
              <span>Audit Event Logged:</span>
              <code className="text-[#22FF6E] font-semibold">&quot;kill&quot;</code>
            </div>
            <div className="flex items-center justify-between">
              <span>Polling Frequency:</span>
              <span className="text-[#F0FFE8] font-medium">20 Hz (every 50 ms)</span>
            </div>
          </div>
        </div>

        {/* Mechanism 2: Mouse-Corner Failsafe */}
        <div className="rounded-[18px] bg-[#0e0e0e] border border-white/[0.06] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <CornerDownLeft className="w-4 h-4 text-[#22FF6E] shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <span className="text-sm font-sans font-semibold text-[#F0FFE8]">Mouse-Corner Failsafe</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[#F5F0E8] font-semibold">
                Exit Code 2
              </span>
            </div>

            <p className="text-xs text-[#F5F0E8]/60 leading-relaxed mb-3.5 font-sans">
              Hardware pointer boundary check. Slamming or flicking the cursor into the top-left screen origin <code className="text-[#22FF6E] font-mono">(0, 0)</code> raises an uncatchable PyAutoGUI hardware exception.
            </p>

            <div className="flex items-center gap-2 my-3 py-2.5 px-3 rounded-[12px] bg-[#141414] border border-white/[0.06]">
              <span className="text-xs font-mono text-[#F5F0E8]/45">Coordinate Action:</span>
              <span className="font-mono text-xs font-semibold text-[#22FF6E] bg-white/5 px-2 py-0.5 rounded border border-white/10">
                Slam pointer to (0, 0)
              </span>
            </div>
          </div>

          <div className="pt-3.5 border-t border-white/[0.06] flex flex-col gap-1.5 text-[11px] font-mono text-[#F5F0E8]/45">
            <div className="flex items-center justify-between">
              <span>Audit Event Logged:</span>
              <code className="text-[#22FF6E] font-semibold">&quot;failsafe_abort&quot;</code>
            </div>
            <div className="flex items-center justify-between">
              <span>Exception Trapped:</span>
              <span className="text-[#F0FFE8] font-medium">pyautogui.FailSafeException</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3.5 border-t border-white/[0.06] flex items-center gap-2 text-xs text-[#F5F0E8]/60 font-sans">
        <Activity className="w-3.5 h-3.5 text-[#22FF6E] shrink-0" strokeWidth={1.5} aria-hidden="true" />
        <span>
          Both mechanisms operate strictly in code and hardware without consulting the language model.
        </span>
      </div>
    </div>
  );
};
