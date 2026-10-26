import React from 'react';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  id?: string;
  children: React.ReactNode;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({
  id,
  children,
  className = '',
  style,
  ...props
}) => {
  return (
    <section
      id={id}
      style={{ scrollMarginTop: '96px', ...style }}
      className={`relative w-full ${className}`}
      {...props}
    >
      {children}
    </section>
  );
};
