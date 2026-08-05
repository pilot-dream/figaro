import { useState } from 'react'
import { X, Building2, User, Mail, Lock } from 'lucide-react'
import { z } from 'zod'

const branchSchema = z.object({
  name: z.string().min(3, 'Nome muito curto'),
  branchAddress: z.string().optional(),
  managerName: z.string().min(3, 'Nome do gerente muito curto'),
  managerEmail: z.string().email('E-mail inválido'),
  managerPassword: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres')
})

type BranchFormData = z.infer<typeof branchSchema>

interface CreateBranchModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: BranchFormData) => Promise<void>
  loading: boolean
}

export function CreateBranchModal({ isOpen, onClose, onSubmit, loading }: CreateBranchModalProps) {
  const [formData, setFormData] = useState<BranchFormData>({
    name: '',
    branchAddress: '',
    managerName: '',
    managerEmail: '',
    managerPassword: ''
  })
  const [errors, setErrors] = useState<Partial<Record<keyof BranchFormData, string>>>({})

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const validData = branchSchema.parse(formData)
      setErrors({})
      await onSubmit(validData)
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        err.errors.forEach(e => {
          if (e.path[0]) newErrors[e.path[0].toString()] = e.message
        })
        setErrors(newErrors)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-[#0A0E14]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-[#0A0E14]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#D4AF37]" />
            Nova Filial
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-figaro-text-secondary hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-figaro-text-secondary mb-1">
                Nome da Filial
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-figaro-text-secondary/50" />
                <input
                  type="text"
                  placeholder="Ex: Fígaro - Unidade Centro"
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-3 text-white placeholder-white/20 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-sm"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-figaro-text-secondary mb-1">
                Endereço (Opcional)
              </label>
              <input
                type="text"
                placeholder="Rua, Número, Bairro..."
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-white placeholder-white/20 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-sm"
                value={formData.branchAddress}
                onChange={e => setFormData({ ...formData, branchAddress: e.target.value })}
              />
            </div>

            <div className="border-t border-white/5 pt-4">
              <h3 className="text-sm font-semibold text-white mb-3">Dados do Gerente</h3>
              
              <div className="space-y-3">
                <div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-figaro-text-secondary/50" />
                    <input
                      type="text"
                      placeholder="Nome do Gerente"
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-3 text-white placeholder-white/20 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-sm"
                      value={formData.managerName}
                      onChange={e => setFormData({ ...formData, managerName: e.target.value })}
                    />
                  </div>
                  {errors.managerName && <p className="text-red-400 text-xs mt-1">{errors.managerName}</p>}
                </div>

                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-figaro-text-secondary/50" />
                    <input
                      type="email"
                      placeholder="E-mail de Acesso"
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-3 text-white placeholder-white/20 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-sm"
                      value={formData.managerEmail}
                      onChange={e => setFormData({ ...formData, managerEmail: e.target.value })}
                    />
                  </div>
                  {errors.managerEmail && <p className="text-red-400 text-xs mt-1">{errors.managerEmail}</p>}
                </div>

                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-figaro-text-secondary/50" />
                    <input
                      type="password"
                      placeholder="Senha Inicial"
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-3 text-white placeholder-white/20 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-sm"
                      value={formData.managerPassword}
                      onChange={e => setFormData({ ...formData, managerPassword: e.target.value })}
                    />
                  </div>
                  {errors.managerPassword && <p className="text-red-400 text-xs mt-1">{errors.managerPassword}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-white font-medium hover:bg-white/5 transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-[#D4AF37] text-black font-semibold hover:bg-[#D4AF37] hover:shadow-[#D4AF37]/30 transition-all text-sm disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Filial'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
