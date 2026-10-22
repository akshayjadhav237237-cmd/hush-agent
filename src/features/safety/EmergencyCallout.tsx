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
      className="bg-surface-2 border border-border rounded-[14px] p-6 sm:p-8 mb-10"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center text-text shrink-0">
            <OctagonAlert className="w-5 h-5 text-accent" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-text-muted font-medium">
              Defensive Containment
            </span>
            <h3 className="text-lg sm:text-xl font-semibold text-text tracking-tight">
              Emergency Stop &amp; Command Sandbox
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-surface border border-border text-text-muted">
            <ShieldAlert className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} aria-hidden="true" />
            Active Failsafes: Corner Abort &amp; Ctrl+Alt+K
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emergency Stop Controls Box */}
        <div className="bg-surface border border-border rounded-[14px] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <OctagonAlert className="w-4 h-4 text-accent shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <h4 className="font-semibold text-text text-sm">
                Emergency Stop Mechanisms
              </h4>
            </div>
            <p className="text-xs text-text-muted leading-relaxed mb-4">
              Hardware interrupts provide immediate human intervention. Both mouse-corner abort (failsafe) and the global kill hotkey (Ctrl+Alt+K) are implemented in the Python orchestrator and covered by unit tests.
            </p>

            <div className="space-y-3">
              {/* Implemented: Mouse-Corner Abort */}
              <div className="p-3.5 rounded-lg bg-surface-2 border border-border">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <CornerDownLeft className="w-3.5 h-3.5 text-success shrink-0" strokeWidth={1.5} aria-hidden="true" />
                    <span className="text-xs font-mono text-text font-semibold">Mouse-Corner Abort</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface border border-border text-success font-medium">
                      <CheckCircle2 className="w-3 h-3 text-success shrink-0" strokeWidth={1.5} aria-hidden="true" />
                      <span>Implemented, unit-tested</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface border border-border text-text-muted">
                      Not yet verified on a real desktop
                    </span>
                  </div>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Moving the pointer into the top-left screen corner triggers an immediate hardware interrupt via pyautogui.FAILSAFE = True. Exits code 2, logs failsafe_abort, and releases input control.
                </p>
                <div className="mt-2 pt-2 border-t border-border/60 text-[11px] font-mono text-success">
                  Active failsafe in Python runtime
                </div>
              </div>

              {/* Implemented, unit-tested: Global Kill Hotkey */}
              <div className="p-3.5 rounded-lg bg-surface-2 border border-border">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Command className="w-3.5 h-3.5 text-success shrink-0" strokeWidth={1.5} aria-hidden="true" />
                    <span className="text-xs font-mono text-text font-semibold">Global Kill Hotkey</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface border border-border text-success font-medium">
                      <CheckCircle2 className="w-3 h-3 text-success shrink-0" strokeWidth={1.5} aria-hidden="true" />
                      <span>Implemented, unit-tested</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface border border-border text-text-muted">
                      Not yet verified on a real desktop
                    </span>
                  </div>
                </div>
                <p className="text-xs text-text-muted leading-relaxed mb-2">
                  Dedicated daemon thread polling global keyboard state at 20 Hz for Ctrl+Alt+K. Instantly aborts the orchestrator and all child processes with exit code 3.
                </p>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <kbd className="px-2 py-0.5 rounded bg-surface border border-border text-text text-[11px]">Ctrl</kbd>
                  <span className="text-text-muted">+</span>
                  <kbd className="px-2 py-0.5 rounded bg-surface border border-border text-text text-[11px]">Alt</kbd>
                  <span className="text-text-muted">+</span>
                  <kbd className="px-2 py-0.5 rounded bg-surface border border-border text-text text-[11px]">K</kbd>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/70 text-xs font-mono text-text-muted flex items-center justify-between">
            <span>Emergency stops:</span>
            <span className="text-success font-semibold">Mouse corner &amp; Ctrl+Alt+K</span>
          </div>
        </div>

        {/* Command Allowlist Box */}
        <div className="bg-surface border border-border rounded-[14px] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="w-4 h-4 text-accent shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <h4 className="font-semibold text-text text-sm">
                Command Allowlist Box
              </h4>
            </div>
            <p className="text-xs text-text-muted leading-relaxed mb-4">
              All shell commands pass through validation in run_cmd before execution. Allowed binaries execute inside WORKDIR and PROJECT_DIR. Disallowed patterns or binaries are rejected at the sandbox boundary.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Allowed Toolchains */}
              <div className="p-3.5 rounded-lg bg-surface-2 border border-border">
                <div className="text-xs font-mono font-semibold text-success flex items-center gap-1.5 mb-2">
                  <Check className="w-3.5 h-3.5 text-success shrink-0" strokeWidth={1.5} aria-hidden="true" />
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
              <div className="p-3.5 rounded-lg bg-surface-2 border border-border">
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
            <span className="text-accent font-semibold">run_cmd sandbox boundary</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
