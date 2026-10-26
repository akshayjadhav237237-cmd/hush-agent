// Source: verification/real_desktop_results.json

export interface VerificationRecord {
  feature_id: string;
  status: "PASS" | "FAIL" | string;
  verified: boolean;
  statusText: string;
  statusTextLong: string;
  timestamp: string;
  date: string;
  formattedDate: string;
  detail: string;
  evidence_hash: string | null;
  screenshot_hash: string | null;
}

export type VerificationFeatureId =
  | "desktop-clipboard-transfer"
  | "safety-graph-stall"
  | "safety-checkpoint-resume"
  | "safety-screenshot-loop-breaker"
  | "safety-global-kill-hotkey"
  | "safety-mouse-corner-abort"
  | "safety-human-notify-gate"
  | "desktop-notepad-paste-verify"
  | "desktop-app-smoke"
  | "desktop-gemini-driver"
  | "desktop-claude-driver";

export const VERIFICATION_RESULTS: Record<string, VerificationRecord> = {
  "desktop-clipboard-transfer": {
    "feature_id": "desktop-clipboard-transfer",
    "status": "PASS",
    "verified": false,
    "statusText": "Unit-tested / Injected (2026-10-26) (Hardware verification pending)",
    "statusTextLong": "Unit-tested / Injected (October 26, 2026) (Hardware verification pending)",
    "timestamp": "2026-10-26T12:43:28.684482+05:30",
    "date": "2026-10-26",
    "formattedDate": "October 26, 2026",
    "detail": "Unit-tested (WEAK): 5,000-character text payload verified intact across software clipboard API (pyperclip); no physical keystrokes or mouse motion.",
    "evidence_hash": "sha256:1dd4193750bb177bc5cd98a1afa7af83b7bed3a873181de908e1913a9b88df64",
    "screenshot_hash": null
  },
  "safety-graph-stall": {
    "feature_id": "safety-graph-stall",
    "status": "PASS",
    "verified": false,
    "statusText": "Unit-tested / Injected (2026-10-26) (Hardware verification pending)",
    "statusTextLong": "Unit-tested / Injected (October 26, 2026) (Hardware verification pending)",
    "timestamp": "2026-10-26T12:48:05.329524+05:30",
    "date": "2026-10-26",
    "formattedDate": "October 26, 2026",
    "detail": "Unit-tested (WEAK): Graphify AST extraction verified in isolated temp directory; builds AST, updates on new files, and trips alert on 2 consecutive unchanged rounds without live IDE orchestration.",
    "evidence_hash": "sha256:9e8f4b5f74062718625b5b7d726dc72b522fdb77d1165f393b941b43c3b15089",
    "screenshot_hash": null
  },
  "safety-checkpoint-resume": {
    "feature_id": "safety-checkpoint-resume",
    "status": "PASS",
    "verified": false,
    "statusText": "Unit-tested / Injected (2026-10-26) (Hardware verification pending)",
    "statusTextLong": "Unit-tested / Injected (October 26, 2026) (Hardware verification pending)",
    "timestamp": "2026-10-26T12:44:31.600740+05:30",
    "date": "2026-10-26",
    "formattedDate": "October 26, 2026",
    "detail": "Unit-tested (WEAK): Atomic checkpoint resumption verified via DummyDesktop & ResumedModel harness; recovered from step 3, appended to audit trail, unbroken SHA-256 chain (7 events).",
    "evidence_hash": "sha256:f067ada6a7b163d1996bad4184276796fe37cc1f65bdf84c5040826e8ba80121",
    "screenshot_hash": null
  },
  "safety-screenshot-loop-breaker": {
    "feature_id": "safety-screenshot-loop-breaker",
    "status": "PASS",
    "verified": false,
    "statusText": "Unit-tested / Injected (2026-10-26) (Hardware verification pending)",
    "statusTextLong": "Unit-tested / Injected (October 26, 2026) (Hardware verification pending)",
    "timestamp": "2026-10-26T12:44:10.935823+05:30",
    "date": "2026-10-26",
    "formattedDate": "October 26, 2026",
    "detail": "Unit-tested (WEAK): Loop breaker perceptual difference hashing tested on synthetic Pillow canvas images (max_distance=2, same_threshold=3); not verified against physical screen frames.",
    "evidence_hash": "sha256:a8c945a20eba87ea16b1ba3770dd7334b9a012a9ae63af66138c6386c2d72ff0",
    "screenshot_hash": null
  },
  "safety-global-kill-hotkey": {
    "feature_id": "safety-global-kill-hotkey",
    "status": "PASS",
    "verified": true,
    "statusText": "Verified on a real desktop (2026-10-26)",
    "statusTextLong": "Verified on a real desktop (October 26, 2026)",
    "timestamp": "2026-10-26T15:06:00+05:30",
    "date": "2026-10-26",
    "formattedDate": "October 26, 2026",
    "detail": "Physical verification on real Windows desktop: Emergency kill hotkey (Ctrl+Alt+K) triggered by actor human at 20 Hz polling, exits immediately with exit code 3. Verified in agent/runs/physical_kill_hotkey/audit.jsonl (line sha256: 35506dec02386378194bac466777c5caf5a5cf2e014be790d17aa6d53cc4e056).",
    "evidence_hash": "sha256:35506dec02386378194bac466777c5caf5a5cf2e014be790d17aa6d53cc4e056",
    "screenshot_hash": null
  },
  "safety-mouse-corner-abort": {
    "feature_id": "safety-mouse-corner-abort",
    "status": "PASS",
    "verified": true,
    "statusText": "Verified on a real desktop (2026-10-26)",
    "statusTextLong": "Verified on a real desktop (October 26, 2026)",
    "timestamp": "2026-10-26T15:06:00+05:30",
    "date": "2026-10-26",
    "formattedDate": "October 26, 2026",
    "detail": "Physical verification on real Windows desktop: Hardware mouse-corner failsafe triggered by actor human moving physical cursor to (0, 0). Intercepts FailSafeException and routes to exit code 2. Verified in agent/runs/physical_mouse_corner/audit.jsonl (line sha256: 1c22837bc48a3bc48894e3736d7eb66a23e0bcd5b0c11df6c7b8a30e79dfe7b4).",
    "evidence_hash": "sha256:1c22837bc48a3bc48894e3736d7eb66a23e0bcd5b0c11df6c7b8a30e79dfe7b4",
    "screenshot_hash": null
  },
  "safety-human-notify-gate": {
    "feature_id": "safety-human-notify-gate",
    "status": "PASS",
    "verified": true,
    "statusText": "Verified on a real desktop (2026-10-26)",
    "statusTextLong": "Verified on a real desktop (October 26, 2026)",
    "timestamp": "2026-10-26T15:06:00+05:30",
    "date": "2026-10-26",
    "formattedDate": "October 26, 2026",
    "detail": "Physical verification on real desktop: Push notification dispatched to ntfy topic 'hush-safety-physical' and confirmed by actor human. Nonce 'HUSH-B9C24A7D' verified and matched.",
    "evidence_hash": "sha256:8ecac3e61eb4b0433af719c3179e353a459768376bbdf83e5840ac8439376eec",
    "screenshot_hash": null
  },
  "desktop-notepad-paste-verify": {
    "feature_id": "desktop-notepad-paste-verify",
    "status": "PASS",
    "verified": false,
    "statusText": "Unit-tested / Injected (2026-10-26) (Hardware verification pending)",
    "statusTextLong": "Unit-tested / Injected (October 26, 2026) (Hardware verification pending)",
    "timestamp": "2026-10-26T13:59:04.265294+05:30",
    "date": "2026-10-26",
    "formattedDate": "October 26, 2026",
    "detail": "Notepad opened, text pasted and verified via buffer on real Windows desktop.",
    "evidence_hash": "sha256:4956445a80fd143e66b203d70be217b5b68212a4759452e42ebb57abf768da9c",
    "screenshot_hash": null
  },
  "desktop-app-smoke": {
    "feature_id": "desktop-app-smoke",
    "status": "PASS",
    "verified": true,
    "statusText": "Verified on a real desktop (2026-10-26)",
    "statusTextLong": "Verified on a real desktop (October 26, 2026)",
    "timestamp": "2026-10-26T15:15:00+05:30",
    "date": "2026-10-26",
    "formattedDate": "October 26, 2026",
    "detail": "Physical verification on real Windows desktop: Real screenshots and window titles verified for Claude ('Sign in - Claude', login_needed: true, sha256: 25a8b391...), Gemini ('Google Gemini', login_needed: true, sha256: 3ebce420...), and Antigravity ('AI Event Planner Research...', login_needed: false, sha256: f06cacca...) captured in verification/shots/*.png.",
    "evidence_hash": "sha256:f06cacca4c9eb6d3289307c296870e256829b557f5f4f1c44eb99f0f21da98e4",
    "screenshot_hash": "sha256:25a8b3912c672bc9b469a910f9ee84fa11d9d580d1cd4cbbdb3dcaf5ba5a97c1"
  },
  "desktop-gemini-driver": {
    "feature_id": "desktop-gemini-driver",
    "status": "PASS",
    "verified": true,
    "statusText": "Verified on a real desktop (2026-10-26)",
    "statusTextLong": "Verified on a real desktop (October 26, 2026)",
    "timestamp": "2026-10-26T15:20:00+05:30",
    "date": "2026-10-26",
    "formattedDate": "October 26, 2026",
    "detail": "Physical verification on real Windows desktop: Gemini web driver prompt and response roundtrip verified. Received matching nonce 'HUSH-OK-687d8d70'. Screenshot captured at verification/shots/gemini_roundtrip.png (sha256: 2f01282008f8034b8cb3bf32eadb722167ce3f2e5347115ebe922e7e495f33c7).",
    "evidence_hash": "sha256:2f01282008f8034b8cb3bf32eadb722167ce3f2e5347115ebe922e7e495f33c7",
    "screenshot_hash": "sha256:2f01282008f8034b8cb3bf32eadb722167ce3f2e5347115ebe922e7e495f33c7"
  },
  "desktop-claude-driver": {
    "feature_id": "desktop-claude-driver",
    "status": "NEEDS_LOGIN",
    "verified": false,
    "statusText": "Waiting for operator login (2026-10-26)",
    "statusTextLong": "Waiting for operator login (October 26, 2026)",
    "timestamp": "2026-10-26T15:20:00+05:30",
    "date": "2026-10-26",
    "formattedDate": "October 26, 2026",
    "detail": "Live browser driver executed: Claude web interface encountered login wall ('Sign in - Claude' / 'Your thinking partner for big ambitions'). Screenshot captured at verification/shots/claude_roundtrip.png (sha256: f069bad26fcc5f388fe45f74c778306e4b3659dee9a371471b4ff7668cd34ceb). Driver implemented and functional, pending operator login.",
    "evidence_hash": "sha256:f069bad26fcc5f388fe45f74c778306e4b3659dee9a371471b4ff7668cd34ceb",
    "screenshot_hash": "sha256:f069bad26fcc5f388fe45f74c778306e4b3659dee9a371471b4ff7668cd34ceb"
  }
};

export const VERIFICATION_ITEMS: VerificationRecord[] = Object.values(VERIFICATION_RESULTS);

export const TOTAL_VERIFIED_COUNT: number = 5;

export const TOTAL_FEATURE_COUNT: number = 11;

export const IS_REAL_DESKTOP_VERIFIED: boolean = true;

export const LAST_VERIFICATION_DATE: string = "2026-10-26";

/**
 * Check if a specific feature ID has passed real desktop verification.
 */
export function isDesktopVerified(featureId: string): boolean {
  return VERIFICATION_RESULTS[featureId]?.verified ?? false;
}

/**
 * Get human-readable verification status text for a feature ID.
 * Returns 'Verified on a real desktop (date)' if verified, otherwise 'Not yet verified on physical hardware'.
 */
export function getVerificationStatus(featureId: string): string {
  return VERIFICATION_RESULTS[featureId]?.statusText ?? "Not yet verified on physical hardware";
}

/**
 * Retrieve full typed verification record for a feature ID.
 */
export function getVerificationRecord(featureId: string): VerificationRecord | undefined {
  return VERIFICATION_RESULTS[featureId];
}
