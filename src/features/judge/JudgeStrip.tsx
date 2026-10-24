import React from 'react';
import { VIDEO_SRC } from '@/data/brand';
import { Play, Terminal, Shield } from 'lucide-react';

export interface JudgeStripProps {
  /** Optional custom CSS classes to merge with the outer container */
  className?: string;
  /** Optional ID for the navigation element */
  id?: string;
}

/**
 * JudgeStrip
 *
 * A slim, highly visible evaluation quick-access bar for hackathon judges and evaluators.
 * Provides quick-access links to key project evaluation anchors:
 * - "Watch the video" (anchors to #video-demo / external link; hidden if VIDEO_SRC === 'TODO' or empty)
 * - "Run the demo" (anchors to #run-it-yourself with terminal icon)
 * - "Read the safety design" (anchors to #safety with shield icon)
 */
export const JudgeStrip: React.FC<JudgeStripProps> = ({
  className = '',
  id = 'judge-strip',
}) => {
  const rawVideoSrc = (VIDEO_SRC as string | undefined)?.trim() ?? '';
  const isVideoAvailable =
    rawVideoSrc.length > 0 && rawVideoSrc.toUpperCase() !== 'TODO';

  const isExternalVideo =
    rawVideoSrc.startsWith('http://') ||
    rawVideoSrc.startsWith('https://') ||
    rawVideoSrc.startsWith('//');

  const videoHref = isExternalVideo
    ? rawVideoSrc
    : rawVideoSrc.startsWith('#')
      ? rawVideoSrc
      : '#video-demo';

  const handleVideoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isExternalVideo) {
      const target =
        document.getElementById('video-demo') ||
        document.getElementById('video-slot');
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', '#video-demo');
      }
    }
  };

  const handleAnchorClick =
    (targetId: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', `#${targetId}`);
      }
    };

  return (
    <nav
      id={id}
      aria-label="Judge evaluation quick-access navigation"
      className={`bg-surface border border-border rounded-full px-6 py-3 my-4 max-w-fit mx-auto shadow-sm ${className}`.trim()}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {/* 1. Watch the video: hidden completely if VIDEO_SRC === 'TODO' or empty */}
        {isVideoAvailable && (
          <a
            href={videoHref}
            onClick={handleVideoClick}
            {...(isExternalVideo
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {})}
            className="inline-flex items-center gap-2 font-mono text-xs tracking-wider uppercase text-text-muted hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-sm"
          >
            <Play
              className="w-3.5 h-3.5 text-accent shrink-0"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span>Watch the video</span>
          </a>
        )}

        {/* 2. Run the demo */}
        <a
          href="#run-it-yourself"
          onClick={handleAnchorClick('run-it-yourself')}
          className="inline-flex items-center gap-2 font-mono text-xs tracking-wider uppercase text-text-muted hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-sm"
        >
          <Terminal
            className="w-3.5 h-3.5 text-accent shrink-0"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <span>Run the demo</span>
        </a>

        {/* 3. Read the safety design */}
        <a
          href="#safety"
          onClick={handleAnchorClick('safety')}
          className="inline-flex items-center gap-2 font-mono text-xs tracking-wider uppercase text-text-muted hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-sm"
        >
          <Shield
            className="w-3.5 h-3.5 text-accent shrink-0"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <span>Read the safety design</span>
        </a>
      </div>
    </nav>
  );
};

export default JudgeStrip;
