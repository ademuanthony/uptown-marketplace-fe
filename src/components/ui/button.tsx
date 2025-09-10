'use client';

import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'default',
      size = 'default',
      loading = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none';

    const variants = {
      default: 'bg-slate-900 text-slate-50 hover:bg-slate-900/90 disabled:opacity-50',
      destructive: 'bg-red-500 text-slate-50 hover:bg-red-500/90 disabled:opacity-50',
      outline:
        'border border-slate-300 bg-white text-gray-700 hover:bg-slate-50 hover:text-gray-900 hover:border-slate-400 disabled:opacity-40',
      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-100/80 disabled:opacity-50',
      ghost: 'hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50',
      link: 'text-slate-900 underline-offset-4 hover:underline disabled:opacity-50',
    };

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    };

    return (
      <button
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
