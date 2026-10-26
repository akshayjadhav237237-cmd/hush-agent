import React from 'react';

interface SerifItalicProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
}

export const SerifItalic: React.FC<SerifItalicProps> = ({
  children,
  className = '',
  color = 'text-[var(--v2-accent)]',
}) => {
  return (
    <span
      className={`font-italic-accent italic font-normal tracking-normal ${color} ${className}`}
      style={{ fontFamily: 'var(--v2-font-italic), "Instrument Serif", Georgia, serif' }}
    >
      {children}
    </span>
  );
};
