import { GlassCard } from './GlassCard'

export function ModalSkeleton() {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md">
        <GlassCard className="p-6 space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="h-6 w-1/3 bg-white/10 rounded animate-pulse" />
            <div className="h-5 w-5 rounded-full bg-white/10 animate-pulse" />
          </div>

          {/* Body Skeletons */}
          <div className="space-y-4">
            <div className="h-10 w-full bg-white/5 rounded-xl animate-pulse" />
            <div className="h-10 w-full bg-white/5 rounded-xl animate-pulse" />
            <div className="h-24 w-full bg-white/5 rounded-xl animate-pulse" />
          </div>

          {/* Footer Skeletons */}
          <div className="pt-4 flex justify-end gap-3">
            <div className="h-10 w-24 bg-white/10 rounded-xl animate-pulse" />
            <div className="h-10 w-32 bg-[var(--color-figaro-blue)]/30 rounded-xl animate-pulse" />
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
