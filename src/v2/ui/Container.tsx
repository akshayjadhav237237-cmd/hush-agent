import React from 'react';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  size?: 'default' | 'narrow';
}

export const Container: React.FC<ContainerProps> = ({
  children,
  className = '',
  size = 'default',
  ...props
}) => {
  const maxWidth = size === 'narrow' ? 'max-w-[1125px]' : 'max-w-[1280px]';
  return (
    <div
      className={`w-full mx-auto px-4 sm:px-6 lg:px-8 ${maxWidth} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
