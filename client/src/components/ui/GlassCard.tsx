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
        'bg-white/[0.05] backdrop-blur-xl border border-white/[0.12] border-t-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-2xl p-6 transition-all duration-300 ios-transition',
        {
          'shadow-[0_0_25px_rgba(17,175,250,0.15)] border-[var(--color-figaro-blue)]/40':
            glow || variant === 'elevated',
          'hover:border-white/30 hover:bg-white/[0.08] cursor-pointer':
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
