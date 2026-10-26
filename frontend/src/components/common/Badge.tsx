import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  emotion?: string;
  size?: 'sm' | 'md' | 'lg';
}

const EMOTION_SOLID_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  neutral: {
    bg: 'bg-zinc-900',
    text: 'text-zinc-300',
    border: 'border-zinc-700',
    dot: 'bg-zinc-400',
  },
  calm: {
    bg: 'bg-sky-950/70',
    text: 'text-sky-300',
    border: 'border-sky-800',
    dot: 'bg-sky-400',
  },
  happy: {
    bg: 'bg-amber-950/70',
    text: 'text-amber-300',
    border: 'border-amber-800',
    dot: 'bg-amber-400',
  },
  sad: {
    bg: 'bg-blue-950/70',
    text: 'text-blue-300',
    border: 'border-blue-800',
    dot: 'bg-blue-400',
  },
  angry: {
    bg: 'bg-rose-950/70',
    text: 'text-rose-300',
    border: 'border-rose-800',
    dot: 'bg-rose-400',
  },
  fearful: {
    bg: 'bg-purple-950/70',
    text: 'text-purple-300',
    border: 'border-purple-800',
    dot: 'bg-purple-400',
  },
  disgust: {
    bg: 'bg-emerald-950/70',
    text: 'text-emerald-300',
    border: 'border-emerald-800',
    dot: 'bg-emerald-400',
  },
  surprised: {
    bg: 'bg-orange-950/70',
    text: 'text-orange-300',
    border: 'border-orange-800',
    dot: 'bg-orange-400',
  },
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  emotion,
  size = 'md',
  className,
  ...props
}) => {
  const emoKey = emotion?.toLowerCase() || '';
  const emoConfig = EMOTION_SOLID_STYLES[emoKey] || {
    bg: 'bg-zinc-900',
    text: 'text-zinc-300',
    border: 'border-border',
    dot: 'bg-zinc-400',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-[11px] px-2 py-0.5 gap-1.5 font-medium',
    lg: 'text-xs px-2.5 py-1 gap-2 font-medium',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center rounded-sm border select-none font-mono tracking-wider uppercase',
          sizeStyles[size],
          emoConfig.bg,
          emoConfig.text,
          emoConfig.border,
          className
        )
      )}
      {...props}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', emoConfig.dot)} />
      <span>{children || emotion}</span>
    </span>
  );
};
