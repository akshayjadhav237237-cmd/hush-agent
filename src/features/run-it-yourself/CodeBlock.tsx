import React, { useState, useCallback } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  caption?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'bash',
  title,
  caption,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
      } else {
        // Fallback for non-secure contexts or older webviews
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        textarea.style.top = '-999999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    } catch (err) {
      console.error('Failed to copy code to clipboard', err);
    }
  }, [code]);

  return (
    <div className="group relative rounded-[10px] border border-border bg-surface-2 overflow-hidden my-3">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-border/70 bg-surface/60 text-xs font-mono text-text-muted">
        <div className="flex items-center gap-2 min-w-0">
          <Terminal className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={1.5} aria-hidden="true" />
          <span className="truncate font-medium text-text">
            {title || language.toUpperCase()}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? 'Copied code to clipboard' : 'Copy code to clipboard'}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-mono transition-all border outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            copied
              ? 'bg-success/15 border-success/40 text-success font-medium'
              : 'bg-surface border-border text-text-muted hover:text-text hover:bg-surface-2'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-success animate-in zoom-in-50 duration-200" strokeWidth={2} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="relative p-3.5 sm:p-4 overflow-x-auto text-xs sm:text-[13px] font-mono leading-relaxed text-text selection:bg-accent/20">
        <pre className="m-0 p-0 font-mono whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>

      {caption && (
        <div className="px-3.5 py-1.5 border-t border-border/50 bg-surface/30 text-[11px] font-mono text-text-muted">
          {caption}
        </div>
      )}
    </div>
  );
};
