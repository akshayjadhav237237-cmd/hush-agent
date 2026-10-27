import React from 'react';
import { ArrowRight } from 'lucide-react';

interface PillButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
}

export const PillButton: React.FC<PillButtonProps> = ({
  href,
  onClick,
  children,
  className = '',
  target,
  rel,
}) => {
  const content = (
    <>
      <span className="font-medium tracking-tight text-sm sm:text-base text-black">{children}</span>
      <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black text-white shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">
        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </span>
    </>
  );

  const baseClasses = `group inline-flex items-center gap-3 pl-5 pr-2 py-2 rounded-full bg-[var(--v2-text)] hover:bg-white text-black transition-all duration-200 shadow-sm focus-visible:outline-2 focus-visible:outline-[var(--v2-accent)] focus-visible:outline-offset-2 ${className}`;

  if (href) {
    return (
      <a href={href} className={baseClasses} target={target} rel={rel}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={baseClasses}>
      {content}
    </button>
  );
};
