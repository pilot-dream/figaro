import React from 'react'
import { cn } from '@/lib/cn'

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive'
  glow?: boolean
}

export function GlassCard({
  className,
  variant = 'default',
  glow = false,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'glass-panel rounded-2xl p-6 transition-all duration-300 ios-transition',
        {
          'glass-glow': glow || variant === 'elevated',
          'hover:border-[var(--color-glass-border-hover)] hover:bg-[rgba(255,255,255,0.12)] cursor-pointer':
            variant === 'interactive',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
