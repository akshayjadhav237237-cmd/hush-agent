import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { useReducedMotion } from './useReducedMotion';

export interface VideoBgProps {
  mp4Src: string;
  webmSrc?: string;
  posterSrc: string;
  alt?: string;
  className?: string;
  overlayGradient?: boolean;
  caption?: React.ReactNode;
}

export const VideoBg: React.FC<VideoBgProps> = ({
  mp4Src,
  webmSrc,
  posterSrc,
  alt = 'Background video',
  className = '',
  overlayGradient = true,
  caption,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const reducedMotion = useReducedMotion();

  // Check Save-Data header or client connection preference
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
      if (conn?.saveData) {
        setSaveData(true);
      }
    }
  }, []);

  const shouldShowVideo = !reducedMotion && !saveData;

  // Autoplay with play() call in useEffect and retry on user interaction if blocked
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldShowVideo) return;

    // Explicitly guarantee muted state for autoplay compliance
    video.defaultMuted = true;
    video.muted = true;

    let unmounted = false;
    let cleanupListeners: (() => void) | null = null;

    const attemptPlay = () => {
      if (unmounted || isPausedByUser) return;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (!unmounted) setIsPlaying(true);
          })
          .catch(() => {
            // Autoplay rejected (e.g. browser policy) - retry on first user interaction
            const onUserInteraction = () => {
              if (cleanupListeners) {
                cleanupListeners();
                cleanupListeners = null;
              }
              if (!unmounted && !isPausedByUser && video.paused) {
                video.play()
                  .then(() => {
                    if (!unmounted) setIsPlaying(true);
                  })
                  .catch(() => {});
              }
            };

            const events = ['pointerdown', 'keydown', 'touchstart', 'click'] as const;
            events.forEach((evt) => {
              window.addEventListener(evt, onUserInteraction, { once: true, passive: true });
            });

            cleanupListeners = () => {
              events.forEach((evt) => {
                window.removeEventListener(evt, onUserInteraction);
              });
            };
          });
      }
    };

    attemptPlay();

    return () => {
      unmounted = true;
      if (cleanupListeners) {
        cleanupListeners();
      }
    };
  }, [shouldShowVideo, isPausedByUser]);

  // IntersectionObserver to pause when offscreen and resume when visible
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldShowVideo) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          if (!isPausedByUser) {
            video.play()
              .then(() => setIsPlaying(true))
              .catch(() => {});
          }
        } else {
          video.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [shouldShowVideo, isPausedByUser]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      setIsPausedByUser(true);
    } else {
      video.play().catch(() => {});
      setIsPlaying(true);
      setIsPausedByUser(false);
    }
  };

  const isAbsolute = className.includes('absolute');
  const containerClasses = [
    !isAbsolute && 'relative',
    'w-full h-full overflow-hidden',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      {/* Poster image as fallback and LCP paint */}
      <img
        src={posterSrc}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover object-center"
        loading="eager"
        fetchPriority="high"
      />

      {/* Video Element rendered only when reduced motion & save data allow */}
      {shouldShowVideo && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={posterSrc}
          className="absolute inset-0 w-full h-full object-cover object-center"
          aria-hidden="true"
          onPlay={() => setIsPlaying(true)}
          onPause={() => {
            if (isPausedByUser) setIsPlaying(false);
          }}
        >
          {/* MP4 with baseline codec first for universal compatibility, WebM second */}
          <source src={mp4Src} type='video/mp4; codecs="avc1.42E01E"' />
          {webmSrc && <source src={webmSrc} type="video/webm" />}
        </video>
      )}

      {/* Optional Gradient Overlay for text contrast */}
      {overlayGradient && (
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Caption if provided */}
      {caption && <div className="absolute z-10">{caption}</div>}

      {/* WCAG 2.2.2 Pause/Play Accessible Toggle Button */}
      {shouldShowVideo && (
        <button
          type="button"
          onClick={togglePlayPause}
          aria-label={isPlaying ? 'Pause background video' : 'Play background video'}
          aria-pressed={!isPlaying}
          title={isPlaying ? 'Pause background video' : 'Play background video'}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/85 text-[var(--v2-text)] hover:text-white backdrop-blur-sm border border-[var(--v2-line)] flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--v2-accent)] focus-visible:outline-offset-2"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 sm:w-4.5 sm:h-4.5" aria-hidden="true" />
          ) : (
            <Play className="w-4 h-4 sm:w-4.5 sm:h-4.5 ml-0.5" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
};
