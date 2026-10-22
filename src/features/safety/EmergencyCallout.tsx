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
      className="bg-[#141414] border border-white/[0.06] rounded-[24px] p-6 sm:p-8 mb-10"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-[14px] bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#22FF6E] shrink-0">
            <OctagonAlert className="w-5 h-5 text-[#22FF6E]" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.15em] text-[#F5F0E8]/45 font-medium">
              [ DEFENSIVE CONTAINMENT ]
            </span>
            <h3 className="text-lg sm:text-xl font-sans font-bold text-[#F0FFE8] tracking-tight">
              Emergency Stop &amp; Command Sandbox
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-white/[0.04] border border-white/[0.06] text-[#22FF6E]">
            <ShieldAlert className="w-3.5 h-3.5 text-[#22FF6E]" strokeWidth={1.5} aria-hidden="true" />
            Active Failsafes: Corner Abort &amp; Ctrl+Alt+K
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emergency Stop Controls Box */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-[18px] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <OctagonAlert className="w-4 h-4 text-[#22FF6E] shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <h4 className="font-sans font-semibold text-[#F0FFE8] text-sm">
                Emergency Stop Mechanisms
              </h4>
            </div>
            <p className="text-xs text-[#F5F0E8]/60 leading-relaxed mb-4 font-sans">
              Hardware interrupts provide immediate human intervention. Both mouse-corner abort (failsafe) and the global kill hotkey (Ctrl+Alt+K) are implemented in the Python orchestrator and covered by unit tests.
            </p>

            <div className="space-y-3.5">
              {/* Implemented: Mouse-Corner Abort */}
              <div className="p-4 rounded-[14px] bg-[#141414] border border-white/[0.06]">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <CornerDownLeft className="w-4 h-4 text-[#22FF6E] shrink-0" strokeWidth={1.5} aria-hidden="true" />
                    <span className="text-xs font-mono text-[#F0FFE8] font-semibold">Mouse-Corner Abort (0, 0)</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-[#22FF6E]/30 bg-[#22FF6E]/10 text-[#22FF6E] font-medium">
                      <CheckCircle2 className="w-3 h-3 text-[#22FF6E] shrink-0" strokeWidth={1.5} aria-hidden="true" />
                      <span>Implemented, unit-tested</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-white/10 bg-white/5 text-[#F5F0E8]/45">
                      Not yet verified on a real desktop
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#F5F0E8]/60 leading-relaxed font-sans">
                  Moving the pointer into the top-left screen corner <code className="font-mono text-[#22FF6E] bg-white/5 px-1 py-0.5 rounded">(0, 0)</code> triggers an immediate hardware interrupt via <code className="font-mono text-[#F0FFE8]">pyautogui.FAILSAFE = True</code>. Exits code 2, logs <code className="font-mono text-[#22FF6E]">failsafe_abort</code>, and releases input control.
                </p>
                <div className="mt-2.5 pt-2 border-t border-white/[0.06] text-[11px] font-mono text-[#22FF6E]">
                  Active failsafe in Python runtime
                </div>
              </div>

              {/* Implemented, unit-tested: Global Kill Hotkey */}
              <div className="p-4 rounded-[14px] bg-[#141414] border border-white/[0.06]">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Command className="w-4 h-4 text-[#22FF6E] shrink-0" strokeWidth={1.5} aria-hidden="true" />
                    <span className="text-xs font-mono text-[#F0FFE8] font-semibold">Global Kill Hotkey (Ctrl+Alt+K)</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-[#22FF6E]/30 bg-[#22FF6E]/10 text-[#22FF6E] font-medium">
                      <CheckCircle2 className="w-3 h-3 text-[#22FF6E] shrink-0" strokeWidth={1.5} aria-hidden="true" />
                      <span>Implemented, unit-tested</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-white/10 bg-white/5 text-[#F5F0E8]/45">
                      Not yet verified on a real desktop
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#F5F0E8]/60 leading-relaxed mb-3 font-sans">
                  Dedicated daemon thread polling global keyboard state at 20 Hz for <kbd className="font-mono text-[#F0FFE8] bg-white/5 px-1.5 py-0.5 rounded border border-white/10">Ctrl+Alt+K</kbd>. Instantly aborts the orchestrator and all child processes with exit code 3.
                </p>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <kbd className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#F0FFE8] text-[11px]">Ctrl</kbd>
                  <span className="text-[#F5F0E8]/45">+</span>
                  <kbd className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#F0FFE8] text-[11px]">Alt</kbd>
                  <span className="text-[#F5F0E8]/45">+</span>
                  <kbd className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#22FF6E] font-bold text-[11px]">K</kbd>
                  <span className="ml-2 text-[11px] text-[#F5F0E8]/45 font-mono">(20 Hz polling)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] text-xs font-mono text-[#F5F0E8]/45 flex items-center justify-between">
            <span>Emergency stops:</span>
            <span className="text-[#22FF6E] font-semibold">Mouse corner (0, 0) &amp; Ctrl+Alt+K (20 Hz)</span>
          </div>
        </div>

        {/* Command Allowlist Box */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-[18px] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="w-4 h-4 text-[#22FF6E] shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <h4 className="font-sans font-semibold text-[#F0FFE8] text-sm">
                Command Allowlist Box
              </h4>
            </div>
            <p className="text-xs text-[#F5F0E8]/60 leading-relaxed mb-4 font-sans">
              All shell commands pass through validation in <code className="font-mono text-[#22FF6E]">run_cmd</code> before execution. Allowed binaries execute inside WORKDIR and PROJECT_DIR. Disallowed patterns or binaries are rejected at the sandbox boundary.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Allowed Toolchains */}
              <div className="p-4 rounded-[14px] bg-[#141414] border border-white/[0.06]">
                <div className="text-xs font-mono font-semibold text-[#22FF6E] flex items-center gap-1.5 mb-2.5">
                  <Check className="w-3.5 h-3.5 text-[#22FF6E] shrink-0" strokeWidth={2} aria-hidden="true" />
                  <span>Whitelisted (10)</span>
                </div>
                <ul className="space-y-1.5 font-mono text-xs text-[#F5F0E8]/70 list-none p-0 m-0">
                  {allowedCommands.map((cmd) => (
                    <li key={cmd} className="truncate flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-[#22FF6E]" aria-hidden="true" />
                      <code>{cmd}</code>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Blocked Commands */}
              <div className="p-4 rounded-[14px] bg-[#141414] border border-white/[0.06]">
                <div className="text-xs font-mono font-semibold text-[#E5776B] flex items-center gap-1.5 mb-2.5">
                  <X className="w-3.5 h-3.5 text-[#E5776B] shrink-0" strokeWidth={2} aria-hidden="true" />
                  <span>Strictly Denied</span>
                </div>
                <ul className="space-y-1.5 font-mono text-xs text-[#F5F0E8]/50 list-none p-0 m-0">
                  {blockedCommands.map((cmd) => (
                    <li key={cmd} className="truncate flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-[#E5776B]" aria-hidden="true" />
                      <code>{cmd}</code>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] text-xs font-mono text-[#F5F0E8]/45 flex items-center justify-between">
            <span>Enforcement:</span>
            <span className="text-[#22FF6E] font-semibold">run_cmd sandbox boundary</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
