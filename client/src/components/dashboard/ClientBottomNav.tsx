import { useNavigate, useLocation } from 'react-router-dom'
import { Calendar, User as UserIcon, Plus } from 'lucide-react'

interface ClientBottomNavProps {
  onActionClick?: () => void;
}

export function ClientBottomNav({ onActionClick }: ClientBottomNavProps) {
  const navigate = useNavigate()
  const location = useLocation()
  
  const currentPath = location.pathname

  // The client starts at /meus-agendamentos now by default
  const isSchedule = currentPath === '/meus-agendamentos' || currentPath === '/'
  const isProfile = currentPath === '/perfil'

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2">
      <nav className="bg-[#0A0E14]/85 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/80 flex items-center justify-around px-8 py-1.5 max-w-lg mx-auto rounded-full relative">
          
          {/* Lado Esquerdo: Agenda */}
          <button 
            onClick={() => navigate('/meus-agendamentos')} 
            className={`flex flex-col items-center justify-center min-w-[60px] transition-colors cursor-pointer ${isSchedule ? 'text-[#D4AF37] font-semibold' : 'text-gray-400 hover:text-white'}`}
          >
             <Calendar className="w-6 h-6" />
             <span className="text-[10px] font-medium mt-1">Agenda</span>
             {isSchedule && <div className="w-1 h-1 bg-[#D4AF37] rounded-full mx-auto mt-1 shadow-sm shadow-[#D4AF37]/30" />}
          </button>
          
          {/* Center Button: Novo Agendamento (Floating FAB) */}
          <div className="relative -top-2.5 mx-4">
             {/* Glow effect optional, but the reference shows a clean solid button */}
             <button 
               onClick={() => {
                 if (onActionClick) {
                   onActionClick()
                 } else {
                   navigate('/meus-agendamentos?agendar=true')
                 }
               }}
               className="bg-gradient-to-r from-[#FBE7A1] to-[#D4AF37] p-3 rounded-full shadow-[0_4px_15px_rgba(245,158,11,0.4)] border-4 border-[#0A0E14] text-white transform active:scale-95 transition-all duration-200 flex items-center justify-center cursor-pointer w-16 h-16"
             >
                <Plus className="w-8 h-8 text-white" strokeWidth={3} />
             </button>
          </div>
          
          {/* Lado Direito: Perfil */}
          <button 
            onClick={() => navigate('/perfil')} 
            className={`flex flex-col items-center justify-center min-w-[60px] transition-colors cursor-pointer ${isProfile ? 'text-[#D4AF37] font-semibold' : 'text-gray-400 hover:text-white'}`}
          >
             <UserIcon className="w-6 h-6" />
             <span className="text-[10px] font-medium mt-1">Perfil</span>
             {isProfile && <div className="w-1 h-1 bg-[#D4AF37] rounded-full mx-auto mt-1 shadow-sm shadow-[#D4AF37]/30" />}
          </button>
          
      </nav>
    </div>
  )
}
