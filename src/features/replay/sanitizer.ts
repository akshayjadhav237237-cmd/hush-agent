/**
 * Sanitization utility for Replay events to strictly prevent
 * raw arguments, API keys, and unredacted clipboard text from leaking into the UI.
 */

const API_KEY_REGEX = /\b(?:sk-[a-zA-Z0-9_\-]{16,}|ghp_[a-zA-Z0-9]{20,}|gho_[a-zA-Z0-9]{20,}|xox[baprs]-[a-zA-Z0-9_\-]{16,})\b/gi;
const BEARER_REGEX = /Bearer\s+[a-zA-Z0-9_\-\.]{16,}/gi;
const RAW_ARGS_REGEX = /\b(?:args|raw_args|arguments)\s*=\s*\{[^}]*\}/gi;
const UNREDACTED_CLIPBOARD_REGEX = /\bunredacted_clipboard\s*[:=]\s*[^\n\r]+/gi;

export function sanitizeReplayText(input: string | undefined | null): string {
  if (!input) return '';

  return input
    .replace(API_KEY_REGEX, '[REDACTED_KEY]')
    .replace(BEARER_REGEX, 'Bearer [REDACTED_TOKEN]')
    .replace(RAW_ARGS_REGEX, 'args=[REDACTED]')
    .replace(UNREDACTED_CLIPBOARD_REGEX, 'clipboard=[REDACTED]');
}
