'use client';
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className = '', id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-white/70">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">{icon}</span>
        )}
        <input
          id={id}
          {...props}
          className={`
            w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white
            placeholder:text-white/30 outline-none
            focus:border-primary/60 focus:bg-white/8 focus:ring-2 focus:ring-primary/20
            transition-all duration-200
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-500/50 focus:border-red-500/70' : ''}
            ${className}
          `}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
