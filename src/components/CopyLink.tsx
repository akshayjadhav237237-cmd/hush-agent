import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, Check } from 'lucide-react';

export interface CopyLinkProps {
  /** The target URL to copy. Defaults to the live Hush website. */
  readonly url?: string;
  /** Idle button label. Defaults to 'Copy Link'. */
  readonly label?: string;
  /** Label shown for 2 seconds after copying. Defaults to 'Copied!'. */
  readonly copiedLabel?: string;
  /** Additional custom Tailwind CSS classes. */
  readonly className?: string;
  /** Whether to render the leading icon. Defaults to true. */
  readonly showIcon?: boolean;
}

const DEFAULT_URL = 'https://akshayjadhav237237-cmd.github.io/hush-agent/';

/**
 * Robust clipboard copy with fallback to execCommand.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  // Modern Async Clipboard API
  if (navigator?.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard.writeText failed, using fallback:', err);
    }
  }

  // Fallback for older browsers or restricted iframe environments
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    textArea.style.opacity = '0';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback clipboard copy failed:', err);
    return false;
  }
}

/**
 * CopyLink component
 * 
 * Interactive share button that copies the live repository/site link to the clipboard.
 * Features an accessible green focus ring, state feedback, and fallback copying.
 */
export const CopyLink: React.FC<CopyLinkProps> = ({
  url = DEFAULT_URL,
  label = 'Copy Link',
  copiedLabel = 'Copied!',
  className = '',
  showIcon = true,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear pending timeouts on component unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);

      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setCopied(false);
        timeoutRef.current = null;
      }, 2000);
    }
  }, [url]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Link copied to clipboard' : `Copy ${url} to clipboard`}
      aria-live="polite"
      className={`group relative inline-flex items-center justify-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg border transition-all duration-200 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22FF6E] focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:scale-[0.98] ${
        copied
          ? 'border-[#22FF6E]/50 bg-[#22FF6E]/10 text-[#22FF6E] shadow-[0_0_12px_rgba(34,255,110,0.15)]'
          : 'border-border bg-surface hover:bg-surface-2 text-text hover:border-text-muted/40 shadow-xs'
      } ${className}`.trim()}
    >
      {showIcon && (
        <span className="shrink-0 inline-flex items-center justify-center" aria-hidden="true">
          {copied ? (
            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#22FF6E] transition-transform duration-150 scale-100" />
          ) : (
            <Link className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-text-muted group-hover:text-text transition-colors duration-150" />
          )}
        </span>
      )}
      <span className="transition-opacity duration-150">
        {copied ? copiedLabel : label}
      </span>
    </button>
  );
};

export default CopyLink;
