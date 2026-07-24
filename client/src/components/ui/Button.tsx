import React from 'react'
import { cn } from '@/lib/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'secondary' | 'ghost' | 'amber'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 ios-transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
        {
          // SOLID CTAs as required by rule of gold
          'bg-[var(--color-figaro-blue)] text-white shadow-lg shadow-[rgba(17,175,250,0.25)] hover:bg-[#069de3]':
            variant === 'primary',
          'bg-[var(--color-figaro-terracotta)] text-white shadow-lg shadow-[rgba(240,85,63,0.25)] hover:bg-[#d9442e]':
            variant === 'danger',
          'bg-[var(--color-figaro-amber)] text-slate-950 font-semibold shadow-lg shadow-[rgba(242,169,59,0.25)] hover:bg-[#e09829]':
            variant === 'amber',
          // GLASS / GHOST
          'glass-panel text-figaro-text-primary hover:bg-[rgba(255,255,255,0.14)] hover:border-[var(--color-glass-border-hover)]':
            variant === 'secondary',
          'bg-transparent text-figaro-text-secondary hover:text-figaro-text-primary hover:bg-[rgba(255,255,255,0.05)]':
            variant === 'ghost',
          // Sizes
          'px-3 py-1.5 text-xs gap-1.5': size === 'sm',
          'px-4 py-2.5 text-sm gap-2': size === 'md',
          'px-6 py-3.5 text-base gap-2.5 rounded-2xl': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
      ) : null}
      {children}
    </button>
  )
}
