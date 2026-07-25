import React from 'react'

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 pb-28 animate-pulse w-full max-w-4xl mx-auto">
      {/* Skeleton Top Welcome Header Banner */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3.5">
          {/* Avatar Skeleton */}
          <div className="w-12 h-12 rounded-full bg-white/10 ring-2 ring-white/5" />
          <div className="space-y-2">
            {/* Subtitle Skeleton */}
            <div className="w-24 h-3 rounded bg-white/10" />
            {/* Title Skeleton */}
            <div className="w-32 h-4 rounded bg-white/10" />
          </div>
        </div>

        {/* Badge Skeleton */}
        <div className="w-20 sm:w-32 h-6 rounded-full bg-white/5 border border-white/10" />
      </div>

      {/* 4 KPIs Grid Skeleton (Simulated TabHome metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/[0.04] rounded-2xl p-4 border border-white/10 flex flex-col gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10" />
            <div className="space-y-2">
              <div className="w-16 h-3 rounded bg-white/10" />
              <div className="w-20 h-5 rounded bg-white/10" />
            </div>
          </div>
        ))}
      </div>

      {/* Próximos Atendimentos Title Skeleton */}
      <div className="pt-4 flex justify-between items-center">
        <div className="w-40 h-5 rounded bg-white/10" />
        <div className="w-24 h-4 rounded bg-white/5" />
      </div>

      {/* Lista de Atendimentos Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-full p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-xl bg-white/10 flex-shrink-0" />
              <div className="space-y-2 py-1">
                <div className="w-32 h-4 rounded bg-white/10" />
                <div className="w-24 h-3 rounded bg-white/10" />
                <div className="w-28 h-3 rounded bg-white/10" />
              </div>
            </div>
            <div className="flex sm:flex-col gap-2 justify-between items-center sm:items-end">
              <div className="w-20 h-6 rounded-full bg-white/10" />
              <div className="w-16 h-4 rounded bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
