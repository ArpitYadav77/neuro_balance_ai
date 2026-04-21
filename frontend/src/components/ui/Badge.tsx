'use client';
import React from 'react';

type BadgeVariant = 'low' | 'medium' | 'high' | 'info' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  const styles: Record<BadgeVariant, string> = {
    low: 'bg-green-500/10 text-green-400 border-green-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    high: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-primary/10 text-blue-400 border-primary/20',
    neutral: 'bg-white/5 text-white/60 border-white/10',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
