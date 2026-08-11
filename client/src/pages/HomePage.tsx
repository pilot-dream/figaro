import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { ProfileSwitcher } from '@/components/ui/ProfileSwitcher'
import { fetchServices, fetchBarbers } from '@/lib/api'
import type { Service, User } from '@/types'
import { useBookingStore } from '@/stores/booking.store'
import { Scissors, Clock, ArrowRight, Star, ShieldCheck, MapPin, Sparkles } from 'lucide-react'

interface HomePageProps {
  onStartBooking: () => void
}

export function HomePage({ onStartBooking }: HomePageProps) {
  const [services, setServices] = useState<Service[]>([])
  const [barbers, setBarbers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const { toggleService, selectedServices } = useBookingStore()

  useEffect(() => {
    async function loadData() {
      try {
        const [srvs, barbs] = await Promise.all([fetchServices(), fetchBarbers()])
        setServices(srvs)
        setBarbers(barbs)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleSelectService = (service: Service) => {
    toggleService(service)
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Top Bar / Header */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#11AFFA] to-[#0A0E14] border border-glass-border flex items-center justify-center shadow-lg shadow-[rgba(17,175,250,0.2)]">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              FÍGARO
              <span className="text-[10px] font-semibold tracking-wider text-[var(--color-figaro-amber)] uppercase px-1.5 py-0.5 rounded bg-[rgba(242,169,59,0.1)] border border-[rgba(242,169,59,0.2)]">
                ORKA
              </span>
            </h1>
            <p className="text-xs text-figaro-text-secondary flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[var(--color-figaro-blue)]" /> Jardins, São Paulo
            </p>
          </div>
        </div>
        <ProfileSwitcher />
      </div>

      {/* Hero Section */}
      <GlassCard glow className="relative overflow-hidden p-8 border-[var(--color-figaro-blue)]/30">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[var(--color-figaro-blue)]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-figaro-blue)]/10 text-[var(--color-figaro-blue)] border border-[var(--color-figaro-blue)]/20">
            <Sparkles className="w-3.5 h-3.5" />
            Precisão de navalha + Interface líquida
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Agende seu horário com a excelência que seu estilo exige.
          </h2>
          <p className="text-sm text-figaro-text-secondary leading-relaxed">
            Profissionais mestres, ambiente exclusivo e agendamento inteligente sem espera.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={onStartBooking}>
              Agendar Horário <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Services Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Serviços & Menu</h3>
            <p className="text-xs text-figaro-text-secondary">Selecione para agendar instantaneamente</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <GlassCard key={i} className="h-28 animate-pulse bg-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((srv) => {
              const isSelected = selectedServices.some((s) => s.id === srv.id)
              return (
                <GlassCard
                  key={srv.id}
                  variant="interactive"
                  onClick={() => handleSelectService(srv)}
                  className={`flex items-center justify-between group transition-all duration-300 ${
                    isSelected ? 'border-[var(--color-figaro-blue)] ring-1 ring-[var(--color-figaro-blue)] bg-[var(--color-figaro-blue)]/10' : ''
                  }`}
                >
                  <div className="space-y-1.5 pr-4">
                    <h4 className={`font-semibold transition-colors ${
                      isSelected ? 'text-[var(--color-figaro-blue)]' : 'text-white group-hover:text-[var(--color-figaro-blue)]'
                    }`}>
                      {srv.name}
                    </h4>
                    <p className="text-xs text-figaro-text-secondary line-clamp-2">{srv.description}</p>
                    <div className="flex items-center gap-3 pt-1 text-xs text-figaro-text-secondary font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[var(--color-figaro-amber)]" />
                        {srv.durationMin} min
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-lg font-extrabold text-white block">
                      R$ {srv.price.toFixed(2)}
                    </span>
                    <span className={`text-[10px] font-medium underline ${
                      isSelected ? 'text-[var(--color-figaro-blue)]' : 'text-figaro-text-secondary group-hover:text-[var(--color-figaro-blue)]'
                    }`}>
                      {isSelected ? 'Selecionado' : 'Selecionar'}
                    </span>
                  </div>
                </GlassCard>
              )
            })}
          </div>
        )}
      </div>

      {/* Barbers Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white tracking-tight">Nossa Equipe de Barbeiros</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {barbers.map((barber) => (
            <GlassCard key={barber.id} className="space-y-3 text-center p-5">
              <img
                src={barber.avatarUrl}
                alt={barber.name}
                className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-glass-border ring-4 ring-white/5"
              />
              <div>
                <h4 className="font-semibold text-white text-sm">{barber.name}</h4>
                <p className="text-xs text-figaro-text-secondary mt-1">{barber.notes}</p>
              </div>
              <div className="flex items-center justify-center gap-1 text-xs text-[var(--color-figaro-amber)]">
                <Star className="w-3.5 h-3.5 fill-current" />
                <Star className="w-3.5 h-3.5 fill-current" />
                <Star className="w-3.5 h-3.5 fill-current" />
                <Star className="w-3.5 h-3.5 fill-current" />
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-white text-[10px] font-bold ml-1">5.0</span>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Guarantee Badge */}
      <GlassCard className="flex items-center gap-4 p-4 border-[var(--color-figaro-mint)]/20">
        <div className="p-3 rounded-xl bg-[var(--color-figaro-mint)]/10 text-[var(--color-figaro-mint)]">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Compromisso Fígaro</h4>
          <p className="text-xs text-figaro-text-secondary">
            Pontualidade garantida ou café espresso por conta da casa.
          </p>
        </div>
      </GlassCard>
      {/* Floating Action Button */}
      {selectedServices.length > 0 && (
        <div className="fixed bottom-24 left-0 right-0 px-4 z-40 animate-in slide-in-from-bottom-10 fade-in duration-300 flex justify-center">
          <Button 
            size="lg" 
            onClick={onStartBooking} 
            className="w-full max-w-md shadow-[0_0_30px_rgba(17,175,250,0.3)] bg-[var(--color-figaro-blue)] hover:bg-[#0B9AE0] text-white rounded-2xl py-4 font-bold text-base flex items-center justify-center gap-2"
          >
            Avançar para Horários <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  )
}
