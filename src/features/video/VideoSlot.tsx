import React from 'react';
import { VIDEO_SRC } from '@/data/brand';
import { Film } from 'lucide-react';

export const VideoSlot: React.FC = () => {
  const videoSrc = VIDEO_SRC as string;
  const isVideoAvailable = videoSrc !== 'TODO' && videoSrc.trim().length > 0;

  return (
    <section
      id="video-slot"
      aria-labelledby="video-slot-heading"
      className="py-20 lg:py-32 border-t border-border bg-bg"
    >
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border border-border bg-surface-2 text-text-muted mb-4">
            <Film className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} aria-hidden="true" />
            <span>Demonstration</span>
          </div>
          <h2
            id="video-slot-heading"
            className="text-3xl sm:text-4xl font-bold tracking-tight text-text"
          >
            Walkthrough
          </h2>
          <p className="mt-3 text-base text-text-muted">
            A recorded run of Hush coordinating tasks and surfacing attention gates.
          </p>
        </div>

        {isVideoAvailable ? (
          <div className="aspect-video w-full rounded-[14px] overflow-hidden border border-border bg-surface-2">
            <video
              controls
              playsInline
              preload="metadata"
              src={VIDEO_SRC}
              className="w-full h-full object-cover"
              aria-label="Hush demonstration video"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        ) : (
          <div
            role="region"
            aria-label="Demo video placeholder"
            className="aspect-video rounded-[14px] border border-border bg-surface-2 flex flex-col items-center justify-center p-8 text-center"
          >
            <p className="text-lg sm:text-xl font-medium text-text-muted">
              Demo video coming soon
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
