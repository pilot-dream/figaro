import { ChevronRight } from 'lucide-react';

export interface PublicBarberCardProps {
  name: string;
  bio?: string;
  avatarUrl?: string;
  onClick?: () => void;
}

export function PublicBarberCard({ name, bio, avatarUrl, onClick }: PublicBarberCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full group flex items-center justify-between p-4 rounded-2xl bg-figaro-black/80 backdrop-blur-md border border-white/10 transition-all duration-300 ease-out hover:scale-[1.02] hover:border-[#11AFFA]/40 hover:bg-white/[0.04] hover:shadow-[0_4px_20px_rgba(17,175,250,0.15)] text-left cursor-pointer"
    >
      <div className="flex items-center gap-4 flex-1 overflow-hidden">
        {/* Foto de Perfil */}
        <div className="flex-shrink-0 relative">
          <img
            src={avatarUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80'}
            alt={name}
            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-full border-2 border-[#11AFFA]/40 group-hover:border-[#11AFFA] transition-colors duration-300"
          />
        </div>

        {/* Informações Centrais */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-lg sm:text-xl truncate">
            {name}
          </h3>
          <p className="text-figaro-text-sec text-xs sm:text-sm mt-1 line-clamp-2 leading-relaxed">
            {bio || 'Profissional especialista em cortes modernos e estilo.'}
          </p>
        </div>
      </div>

      {/* Ícone Indicador de Ação */}
      <div className="flex-shrink-0 ml-4 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 border border-white/10 group-hover:bg-[#11AFFA]/10 group-hover:border-[#11AFFA]/30 group-hover:text-[#11AFFA] transition-all duration-300">
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white/50 group-hover:text-[#11AFFA] transition-colors duration-300" />
      </div>
    </button>
  );
}
