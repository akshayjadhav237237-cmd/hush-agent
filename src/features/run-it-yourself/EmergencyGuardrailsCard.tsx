import React from 'react';
import { OctagonAlert, CornerDownLeft, ShieldAlert, Cpu, Activity } from 'lucide-react';

export const EmergencyGuardrailsCard: React.FC = () => {
  return (
    <div className="rounded-[14px] border border-border bg-surface-2 p-5 sm:p-6 my-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-text shrink-0">
            <OctagonAlert className="w-4 h-4 text-accent" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted font-medium">
              Dual Hardware &amp; OS Fail-Safe Engine
            </span>
            <h4 className="text-base sm:text-lg font-semibold text-text tracking-tight">
              Two Independent Kill Mechanisms
            </h4>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-surface border border-border text-text-muted self-start sm:self-auto">
          <ShieldAlert className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} aria-hidden="true" />
          <span>Active in Real Desktop Runs</span>
        </div>
      </div>

      {/* Mechanism Cards Grid */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mechanism 1: Global Hotkey */}
        <div className="rounded-[10px] bg-surface border border-border p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-accent shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <span className="text-sm font-semibold text-text">Global Hotkey Interrupt</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-2 border border-border text-text font-semibold">
                Exit Code 3
              </span>
            </div>

            <p className="text-xs text-text-muted leading-relaxed mb-3">
              Asynchronous background worker polling Windows <code className="text-text font-mono">GetAsyncKeyState</code> at 20&nbsp;Hz globally. Intercepts the orchestrator before or during any tool call.
            </p>

            <div className="flex items-center gap-1.5 my-3 py-2 px-3 rounded-[8px] bg-surface-2 border border-border/80">
              <span className="text-xs font-mono text-text-muted mr-1">Trigger:</span>
              <kbd className="px-2 py-0.5 rounded bg-surface border border-border font-mono text-xs font-semibold text-text shadow-xs">
                Ctrl
              </kbd>
              <span className="text-text-muted text-xs font-mono">+</span>
              <kbd className="px-2 py-0.5 rounded bg-surface border border-border font-mono text-xs font-semibold text-text shadow-xs">
                Alt
              </kbd>
              <span className="text-text-muted text-xs font-mono">+</span>
              <kbd className="px-2 py-0.5 rounded bg-surface border border-border font-mono text-xs font-semibold text-text shadow-xs">
                K
              </kbd>
            </div>
          </div>

          <div className="pt-3 border-t border-border/70 flex flex-col gap-1 text-[11px] font-mono text-text-muted">
            <div className="flex items-center justify-between">
              <span>Audit Event Logged:</span>
              <code className="text-accent font-semibold">"kill"</code>
            </div>
            <div className="flex items-center justify-between">
              <span>Polling Frequency:</span>
              <span className="text-text font-medium">20 Hz (every 50 ms)</span>
            </div>
          </div>
        </div>

        {/* Mechanism 2: Mouse-Corner Failsafe */}
        <div className="rounded-[10px] bg-surface border border-border p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <CornerDownLeft className="w-4 h-4 text-accent shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <span className="text-sm font-semibold text-text">Mouse-Corner Failsafe</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-2 border border-border text-text font-semibold">
                Exit Code 2
              </span>
            </div>

            <p className="text-xs text-text-muted leading-relaxed mb-3">
              Hardware pointer boundary check. Slamming or flicking the cursor into the top-left screen origin <code className="text-text font-mono">(0, 0)</code> raises an uncatchable PyAutoGUI hardware exception.
            </p>

            <div className="flex items-center gap-2 my-3 py-2 px-3 rounded-[8px] bg-surface-2 border border-border/80">
              <span className="text-xs font-mono text-text-muted">Coordinate Action:</span>
              <span className="font-mono text-xs font-semibold text-text bg-surface px-2 py-0.5 rounded border border-border">
                Slam pointer to (0, 0)
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-border/70 flex flex-col gap-1 text-[11px] font-mono text-text-muted">
            <div className="flex items-center justify-between">
              <span>Audit Event Logged:</span>
              <code className="text-accent font-semibold">"failsafe_abort"</code>
            </div>
            <div className="flex items-center justify-between">
              <span>Exception Trapped:</span>
              <span className="text-text font-medium">pyautogui.FailSafeException</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border/70 flex items-center gap-2 text-xs text-text-muted font-sans">
        <Activity className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={1.5} aria-hidden="true" />
        <span>
          Both mechanisms operate strictly in code and hardware without consulting the language model.
        </span>
      </div>
    </div>
  );
};
