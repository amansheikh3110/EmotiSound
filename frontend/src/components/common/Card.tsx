import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  className,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-card border border-border rounded-lg p-5 transition-colors duration-150',
          hoverable && 'hover:border-border-light hover:bg-surface/40',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
