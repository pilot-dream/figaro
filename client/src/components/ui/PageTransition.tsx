import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()

  return (
    <div
      key={location.pathname}
      className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out fill-mode-both"
    >
      {children}
    </div>
  )
}
