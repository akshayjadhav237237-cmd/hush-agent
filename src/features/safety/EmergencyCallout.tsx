import React from 'react';
import {
  OctagonAlert,
  Terminal,
  ShieldAlert,
  Check,
  X,
  CheckCircle2,
  CornerDownLeft,
  Command,
} from 'lucide-react';

export const EmergencyCallout: React.FC = () => {
  const allowedCommands = [
    'git',
    'npm',
    'node',
    'python',
    'pip',
    'dir',
    'type',
    'echo',
    'mkdir',
    'cd',
  ];
  const blockedCommands = [
    'rm -rf / rmdir /s',
    'curl / wget',
    'powershell -enc',
    'format / diskpart',
    'reg delete / shutdown',
    'Pipes & redirects (|, ;, &&, >)',
  ];

  return (
    <aside
      aria-label="Emergency controls and command allowlist"
      className="bg-[#141414] dark:bg-[#141414] bg-surface border border-border rounded-[24px] p-6 sm:p-8 mb-10 shadow-xs"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-text shrink-0">
            <OctagonAlert className="w-5 h-5 text-accent" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-text-muted font-medium">
              Defensive Containment
            </span>
            <h3 className="text-lg sm:text-xl font-semibold text-text tracking-tight">
              Emergency Stop &amp; Command Guardrail
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-surface-2 border border-border text-text-muted">
            <ShieldAlert className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} aria-hidden="true" />
            Active Failsafes: Mouse Corner (0, 0) &amp; Ctrl+Alt+K
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emergency Stop Controls Box */}
        <div className="bg-surface-2/60 border border-border rounded-[20px] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <OctagonAlert className="w-4 h-4 text-accent shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <h4 className="font-semibold text-text text-sm">
                Emergency Stop Mechanisms
              </h4>
            </div>
            <p className="text-xs text-text-muted leading-relaxed mb-4">
              Hardware interrupts provide immediate human intervention. Both mouse-corner abort (failsafe at coordinate 0, 0) and the global kill hotkey (Ctrl+Alt+K polled at 20 Hz) are implemented in the Python orchestrator and covered by unit tests.
            </p>

            <div className="space-y-3">
              {/* Implemented: Mouse-Corner Abort */}
              <div className="p-3.5 rounded-xl bg-surface border border-border">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <CornerDownLeft className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={1.5} aria-hidden="true" />
                    <span className="text-xs font-mono text-text font-semibold">Mouse-Corner Abort</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 border border-accent/30 bg-accent/10 text-accent font-mono text-xs px-2.5 py-0.5 rounded-full font-medium">
                      <CheckCircle2 className="w-3 h-3 text-accent shrink-0" strokeWidth={1.5} aria-hidden="true" />
                      <span>Implemented, unit-tested</span>
                    </span>
                    <span className="inline-flex items-center gap-1 border border-border bg-surface-2/60 text-text-muted font-mono text-xs px-2 py-0.5 rounded-full">
                      Not yet verified on a real desktop
                    </span>
                  </div>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Moving the pointer into the top-left screen corner (0, 0) triggers an immediate hardware interrupt via <code className="font-mono text-text">pyautogui.FAILSAFE = True</code>. Exits code 2, logs failsafe_abort, and releases input control.
                </p>
                <div className="mt-2 pt-2 border-t border-border/60 text-[11px] font-mono text-accent">
                  Active failsafe in Python runtime · Corner coordinate (0, 0)
                </div>
              </div>

              {/* Implemented, unit-tested: Global Kill Hotkey */}
              <div className="p-3.5 rounded-xl bg-surface border border-border">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Command className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={1.5} aria-hidden="true" />
                    <span className="text-xs font-mono text-text font-semibold">Global Kill Hotkey</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 border border-accent/30 bg-accent/10 text-accent font-mono text-xs px-2.5 py-0.5 rounded-full font-medium">
                      <CheckCircle2 className="w-3 h-3 text-accent shrink-0" strokeWidth={1.5} aria-hidden="true" />
                      <span>Implemented, unit-tested</span>
                    </span>
                    <span className="inline-flex items-center gap-1 border border-border bg-surface-2/60 text-text-muted font-mono text-xs px-2 py-0.5 rounded-full">
                      Not yet verified on a real desktop
                    </span>
                  </div>
                </div>
                <p className="text-xs text-text-muted leading-relaxed mb-2">
                  Dedicated daemon thread polling global keyboard state at 20 Hz for <code className="font-mono text-text">Ctrl+Alt+K</code>. Instantly aborts the orchestrator and all child processes with exit code 3.
                </p>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <kbd className="px-2 py-0.5 rounded-md bg-surface-2 border border-border text-text text-[11px]">Ctrl</kbd>
                  <span className="text-text-muted">+</span>
                  <kbd className="px-2 py-0.5 rounded-md bg-surface-2 border border-border text-text text-[11px]">Alt</kbd>
                  <span className="text-text-muted">+</span>
                  <kbd className="px-2 py-0.5 rounded-md bg-surface-2 border border-border text-text text-[11px]">K</kbd>
                  <span className="ml-2 text-[11px] text-text-muted">Polled at 20 Hz</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/70 text-xs font-mono text-text-muted flex items-center justify-between">
            <span>Emergency stops:</span>
            <span className="text-accent font-semibold">Mouse corner (0, 0) &amp; Ctrl+Alt+K (20 Hz)</span>
          </div>
        </div>

        {/* Command Allowlist Box */}
        <div className="bg-surface-2/60 border border-border rounded-[20px] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="w-4 h-4 text-accent shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <h4 className="font-semibold text-text text-sm">
                Command Allowlist Box
              </h4>
            </div>
            <p className="text-xs text-text-muted leading-relaxed mb-4">
              All shell commands pass through validation in <code className="font-mono text-text">run_cmd</code> before execution. Allowed binaries execute inside WORKDIR and PROJECT_DIR. Disallowed patterns or binaries are rejected at the command allowlist boundary.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Allowed Toolchains */}
              <div className="p-3.5 rounded-xl bg-surface border border-border">
                <div className="text-xs font-mono font-semibold text-accent flex items-center gap-1.5 mb-2">
                  <Check className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  <span>Whitelisted (10)</span>
                </div>
                <ul className="space-y-1 font-mono text-xs text-text-muted list-none p-0 m-0">
                  {allowedCommands.map((cmd) => (
                    <li key={cmd} className="truncate">
                      <code>{cmd}</code>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Blocked Commands */}
              <div className="p-3.5 rounded-xl bg-surface border border-border">
                <div className="text-xs font-mono font-semibold text-danger flex items-center gap-1.5 mb-2">
                  <X className="w-3.5 h-3.5 text-danger shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  <span>Strictly Denied</span>
                </div>
                <ul className="space-y-1 font-mono text-xs text-text-muted list-none p-0 m-0">
                  {blockedCommands.map((cmd) => (
                    <li key={cmd} className="truncate">
                      <code>{cmd}</code>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/70 text-xs font-mono text-text-muted flex items-center justify-between">
            <span>Enforcement:</span>
            <span className="text-accent font-semibold">run_cmd allowlist boundary</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
