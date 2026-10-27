import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useScroll, useTransform, motion, MotionValue } from 'motion/react';
import { useReducedMotion } from '@/v2/ui/useReducedMotion';

export interface WordToken {
  word: string;
  isItalic?: boolean;
}

export interface WordRevealProps {
  tokens?: WordToken[];
  text?: string;
  className?: string;
}

interface WordSpanProps {
  word: string;
  isItalic?: boolean;
  progress: MotionValue<number>;
  range: [number, number];
  reducedMotion: boolean;
  isMounted: boolean;
  isLast: boolean;
}

const WordSpan: React.FC<WordSpanProps> = ({
  word,
  isItalic,
  progress,
  range,
  reducedMotion,
  isMounted,
  isLast,
}) => {
  const opacity = useTransform(progress, range, [0, 1]);
  const y = useTransform(progress, range, [10, 0]);

  return (
    <motion.span
      style={{
        opacity: reducedMotion || !isMounted ? 1 : opacity,
        y: reducedMotion || !isMounted ? 0 : y,
        fontFamily: isItalic ? 'var(--v2-font-italic), "Instrument Serif", Georgia, serif' : undefined,
      }}
      className={`inline-block ${!isLast ? 'mr-[0.28em]' : ''} ${
        isItalic
          ? 'font-italic-accent text-[var(--v2-accent)] italic font-normal tracking-normal'
          : 'text-[var(--v2-headline)] font-bold'
      }`}
    >
      {word}
    </motion.span>
  );
};

export const WordReveal: React.FC<WordRevealProps> = ({
  tokens,
  text,
  className = '',
}) => {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const reducedMotion = useReducedMotion();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const parsedTokens: WordToken[] = useMemo(() => {
    if (tokens && tokens.length > 0) return tokens;
    if (text) {
      return text
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => ({ word: w }));
    }
    return [];
  }, [tokens, text]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.85', 'end 0.35'],
  });

  const total = parsedTokens.length;

  return (
    <h2
      ref={containerRef}
      className={`font-display font-bold leading-tight ${className}`}
    >
      {parsedTokens.map((token, index) => {
        const start = total > 1 ? (index / total) * 0.75 : 0;
        const end = Math.min(start + 0.25, 1);
        return (
          <WordSpan
            key={`${token.word}-${index}`}
            word={token.word}
            isItalic={token.isItalic}
            progress={scrollYProgress}
            range={[start, end]}
            reducedMotion={reducedMotion}
            isMounted={isMounted}
            isLast={index === total - 1}
          />
        );
      })}
    </h2>
  );
};
