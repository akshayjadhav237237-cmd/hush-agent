import React from 'react';

interface EyebrowProps {
  label: string;
  className?: string;
}

export const Eyebrow: React.FC<EyebrowProps> = ({ label, className = '' }) => {
  // Format as [ LABEL ]
  const text = label.startsWith('[') && label.endsWith(']') ? label : `[ ${label.trim()} ]`;
  return (
    <div
      className={`font-mono text-xs sm:text-sm uppercase tracking-[0.2em] text-[var(--v2-text)]/60 ${className}`}
    >
      {text}
    </div>
  );
};
