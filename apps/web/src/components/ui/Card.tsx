'use client';
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', glow = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`glass-card p-5 ${glow ? 'glow-pulse' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  className?: string;
}

export function MetricCard({ title, value, unit, subtitle, icon, color, className = '' }: MetricCardProps) {
  return (
    <div className={`glass-card p-5 flex flex-col gap-3 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest text-white/40">{title}</span>
        {icon && <span className="text-white/50">{icon}</span>}
      </div>
      <div className="flex items-end gap-1">
        <span
          className="text-4xl font-bold font-heading leading-none"
          style={{ color: color || 'var(--text-primary)' }}
        >
          {value}
        </span>
        {unit && <span className="text-sm text-white/40 mb-0.5">{unit}</span>}
      </div>
      {subtitle && <p className="text-xs text-white/40">{subtitle}</p>}
    </div>
  );
}
