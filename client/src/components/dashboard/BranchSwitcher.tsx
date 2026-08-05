import { useState, useRef, useEffect } from 'react'
import { Building2, ChevronDown, Check, Globe } from 'lucide-react'
import { useBranchStore } from '@/stores/branch.store'
import { useAuthStore } from '@/stores/auth.store'

export function BranchSwitcher() {
  const { user } = useAuthStore()
  const { branches, selectedBranch, setSelectedBranch, fetchBranches } = useBranchStore()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch branches on mount if OWNER
  useEffect(() => {
    if (user?.role === 'OWNER' && user?.subscriptionPlan === 'ENTERPRISE') {
      fetchBranches()
    }
  }, [user, fetchBranches])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Only render for OWNER with Enterprise plan
  if (user?.role !== 'OWNER' || user?.subscriptionPlan !== 'ENTERPRISE') return null

  const currentLabel = selectedBranch?.branchName || 'Toda a Rede'

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0A0E14]/90 backdrop-blur-md border border-white/10 hover:border-[#D4AF37] transition-all cursor-pointer group"
      >
        <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
        <span className="text-[11px] font-semibold text-white max-w-[100px] truncate">
          {currentLabel}
        </span>
        <ChevronDown className={`w-3 h-3 text-figaro-text-secondary transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-56 rounded-xl bg-[#0A0E14]/95 backdrop-blur-2xl border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.6)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-3 py-2 border-b border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-figaro-text-secondary">
              Selecionar Unidade
            </span>
          </div>

          {/* "All network" option */}
          <button
            onClick={() => { setSelectedBranch(null); setOpen(false) }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
              !selectedBranch
                ? 'bg-[#D4AF37] text-[#D4AF37]'
                : 'text-figaro-text-secondary hover:bg-white/5 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span className="text-xs font-medium flex-1">Toda a Rede</span>
            {!selectedBranch && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
          </button>

          <div className="border-t border-white/5" />

          {/* Branch list */}
          <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            {branches.map((branch, idx) => {
              const isSelected = selectedBranch?.id === branch.id
              const isFirst = idx === 0

              return (
                <button
                  key={branch.id}
                  onClick={() => { setSelectedBranch(branch); setOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
                    isSelected
                      ? 'bg-[#D4AF37] text-[#D4AF37]'
                      : 'text-figaro-text-secondary hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium block truncate">
                      {branch.branchName || branch.name}
                    </span>
                    {isFirst && (
                      <span className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-wider">Matriz</span>
                    )}
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
