import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClientBottomNav } from '@/components/dashboard/ClientBottomNav'
import { useAuthStore } from '@/stores/auth.store'
import { LogOut, User as UserIcon, Phone, Mail, Camera, ChevronRight, Settings } from 'lucide-react'

export function ClientProfilePage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = () => {
    // Aqui no futuro chamaria a API para atualizar
    setIsEditing(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen w-full bg-[#0A0E14] text-white pb-24 overflow-x-hidden">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          Meu Perfil
        </h1>
        <button className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition">
          <Settings className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Avatar Section */}
      <div className="px-6 flex flex-col items-center mt-2 mb-8">
        <div className="relative">
          <img 
            src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.name || 'Cliente'}&background=1a1c23&color=fbbf24`} 
            alt="Profile" 
            className="w-28 h-28 rounded-full object-cover border-4 border-[#1a1c23] shadow-[0_0_20px_rgba(0,0,0,0.5)]"
          />
          <button className="absolute bottom-0 right-0 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-black border-2 border-[#0A0E14] shadow-lg cursor-pointer hover:bg-amber-400 transition-colors">
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <h2 className="text-xl font-bold mt-4">{user?.name || 'Usuário Fígaro'}</h2>
        <p className="text-sm text-amber-400 font-medium">Membro {user?.tier || 'GOLD'}</p>
      </div>

      {/* Form / Info Section */}
      <div className="px-4">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl">
          
          <div className="mb-6">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-2">
              <UserIcon className="w-4 h-4" /> Nome Completo
            </label>
            {isEditing ? (
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0A0E14] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-400 focus:outline-none transition-colors"
              />
            ) : (
              <p className="text-lg font-medium text-white">{name}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4" /> Celular (WhatsApp)
            </label>
            {isEditing ? (
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#0A0E14] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-400 focus:outline-none transition-colors"
              />
            ) : (
              <p className="text-lg font-medium text-white">{phone || 'Não informado'}</p>
            )}
          </div>

          <div className="mb-8">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4" /> E-mail
            </label>
            <p className="text-lg font-medium text-gray-300">{user?.email || 'email@exemplo.com'}</p>
          </div>

          {isEditing ? (
            <button 
              onClick={handleSave}
              className="w-full bg-gradient-to-r from-amber-200 to-amber-500 text-black font-semibold rounded-xl py-3.5 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Salvar Alterações
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl py-3.5 transition-colors cursor-pointer"
            >
              Editar Perfil
            </button>
          )}

        </div>
      </div>

      {/* Preferences / Options */}
      <div className="px-4 mt-6">
        <button className="w-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-between transition-colors mb-3 cursor-pointer group">
          <span className="font-semibold text-white">Preferências de Notificação</span>
          <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition" />
        </button>
        <button className="w-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-between transition-colors cursor-pointer group">
          <span className="font-semibold text-white">Termos e Privacidade</span>
          <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition" />
        </button>
      </div>

      {/* Logout Action */}
      <div className="px-4 mt-8 mb-12">
        <button 
          onClick={handleLogout}
          className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          Sair da Conta
        </button>
      </div>

      <ClientBottomNav />
    </div>
  )
}
