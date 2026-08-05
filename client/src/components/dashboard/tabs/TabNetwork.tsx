import { useState } from 'react'
import { Building2, Plus, Users, Scissors } from 'lucide-react'
import { useBranchStore } from '@/stores/branch.store'
import { CreateBranchModal } from '../CreateBranchModal'

export function TabNetwork() {
  const { branches, createBranch } = useBranchStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCreateBranch = async (data: any) => {
    setLoading(true)
    try {
      await createBranch(data)
      setIsModalOpen(false)
    } catch (error) {
      console.error(error)
      // Error is handled in the store / toast
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#D4AF37]" />
            Minha Rede
          </h2>
          <p className="text-sm text-figaro-text-secondary mt-1">Gerencie a matriz e suas filiais</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-[#D4AF37] transition-all shadow-[#D4AF37]/30 text-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Filial
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((branch, idx) => {
          const isMatriz = idx === 0

          return (
            <div 
              key={branch.id} 
              className={`glass-panel p-5 relative overflow-hidden group transition-all border ${
                isMatriz ? 'border-[#D4AF37] shadow-[0_0_15px_rgba(245,158,11,0.05)]' : 'border-white/10 hover:border-[#D4AF37]'
              }`}
            >
              {isMatriz && (
                <div className="absolute top-0 right-0 px-3 py-1 bg-[#D4AF37] text-black text-[10px] font-bold tracking-wider rounded-bl-lg uppercase">
                  Matriz
                </div>
              )}
              {!isMatriz && (
                <div className="absolute top-0 right-0 px-3 py-1 bg-[#D4AF37] text-[#D4AF37] text-[10px] font-bold tracking-wider rounded-bl-lg uppercase">
                  Filial
                </div>
              )}

              <div className="flex items-start gap-3 mb-4">
                <div className={`p-2 rounded-lg ${isMatriz ? 'bg-[#D4AF37]' : 'bg-white/5'}`}>
                  <Building2 className={`w-5 h-5 ${isMatriz ? 'text-[#D4AF37]' : 'text-white'}`} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{branch.branchName || branch.name}</h3>
                  {/* Address would go here if fetched */}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/5">
                <div className="flex flex-col">
                  <span className="text-[10px] text-figaro-text-secondary font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Equipe
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {branch.teamCount || 0}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-figaro-text-secondary font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Scissors className="w-3 h-3" /> Agendamentos
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {branch.appointmentCount || 0}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <CreateBranchModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateBranch}
        loading={loading}
      />
    </div>
  )
}
