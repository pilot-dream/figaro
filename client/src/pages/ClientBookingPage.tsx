import { useEffect, useState, Component } from 'react'
import type { ReactNode } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useToastStore } from '@/stores/toast.store'
import { useAuthStore } from '@/stores/auth.store'
import { fetchBarberBySlug, fetchAvailability, createAppointment } from '@/lib/api'
import { useBookingStore } from '@/stores/booking.store'
import type { User, Service, TimeSlot } from '@/types'
import {
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  LogIn,
  UserPlus,
  RefreshCw,
  Bell,
  Heart,
  Star,
  Home,
  Calendar,
  Wallet,
  User as UserIcon,
  Check
} from 'lucide-react'
import { ClientBottomNav } from '@/components/dashboard/ClientBottomNav'
import { getBrasiliaTodayStr, getBrasiliaNextDays, formatBrasiliaTime } from '@/lib/date'

class LocalErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: any}> {
  state = { hasError: false, error: null as any }
  static getDerivedStateFromError(error: any) { return { hasError: true, error } }
  componentDidCatch(error: any, info: any) { console.error(error, info) }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 m-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl text-white font-mono text-xs overflow-auto">
          <h2 className="text-xl text-white font-bold mb-4">CRASH DETECTED</h2>
          <p className="text-[#8C97A8]">{this.state.error?.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}

export function ClientBookingPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [barber, setBarber] = useState<User | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(getBrasiliaTodayStr())
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)

  const [clientName, setClientName] = useState(user?.name || '')
  const [clientPhone, setClientPhone] = useState(user?.phone || '')
  const [clientNotes, setClientNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)

  const recurringType = useBookingStore(s => s.recurringType)
  const setRecurringType = useBookingStore(s => s.setRecurringType)

  useEffect(() => {
    if (user) {
      if (!clientName) setClientName(user.name)
      if (!clientPhone && user.phone) setClientPhone(user.phone)
    }
  }, [user, clientName, clientPhone])

  const totalDuration = selectedServices.reduce((acc, s) => acc + (Number(s.durationMin) || 0), 0)

  const availableDates = getBrasiliaNextDays(14)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    fetchBarberBySlug(slug)
      .then((data) => {
        setBarber(data.barber)
        setServices(data.services)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (step === 2 && barber && totalDuration > 0) {
      setSlotsLoading(true)
      fetchAvailability(selectedDate, totalDuration, barber.id)
        .then(setSlots)
        .catch(() => setSlots([]))
        .finally(() => setSlotsLoading(false))
    }
  }, [step, selectedDate, totalDuration, barber])

  const toggleService = (service: Service) => {
    setSelectedServices((prev) =>
      prev.some((s) => s.id === service.id)
        ? prev.filter((s) => s.id !== service.id)
        : [...prev, service]
    )
  }

  const handleConfirmAppointment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!selectedSlot || !clientName || !clientPhone || !barber) return

    setSubmitting(true)
    try {
      await createAppointment({
        clientId: user?.id,
        barberId: barber.id,
        serviceIds: selectedServices.map((s) => s.id),
        startTime: selectedSlot.startTime,
        clientName,
        clientPhone,
        notes: clientNotes
      })
      setCompleted(true)
    } catch {
      useToastStore.getState().addToast('Erro ao realizar agendamento', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0A0E14] text-white overflow-x-hidden pb-24">
        <div className="px-4 py-20 flex justify-center">
          <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (notFound || !barber) {
    return (
      <div className="min-h-screen w-full bg-[#0A0E14] text-white overflow-x-hidden pb-24">
        <div className="px-4 py-20 flex justify-center items-center">
          <div className="p-8 space-y-4 bg-white/5 backdrop-blur-md border border-white/10 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h2 className="text-white font-bold text-lg">Barbeiro não encontrado</h2>
            <p className="text-[#8C97A8] text-sm">Verifique o link ou faça login.</p>
            <Link to="/login" className="block mt-4 bg-gradient-to-r from-amber-200 to-amber-500 text-black font-semibold rounded-xl py-3 text-sm">
              Ir para Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="min-h-screen w-full bg-[#0A0E14] text-white overflow-x-hidden pb-24">
        <div className="px-4 py-12 flex flex-col items-center">
          <div className="p-8 text-center space-y-6 bg-white/5 backdrop-blur-md border border-white/10 w-full">
            <div className="w-20 h-20 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto border border-green-500/30">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div>
              <h2 className="text-white font-bold text-2xl">Agendamento Confirmado!</h2>
              <p className="text-[#8C97A8] text-sm mt-2">
                Detalhes enviados para seu WhatsApp.
              </p>
            </div>
            
            <button
              onClick={() => {
                setCompleted(false)
                setStep(1)
                setSelectedServices([])
                setSelectedSlot(null)
              }}
              className="w-full bg-gradient-to-r from-amber-200 to-amber-500 text-black font-semibold rounded-xl py-4"
            >
              Realizar Novo Agendamento
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <LocalErrorBoundary>
      {/* 1. Main Wrapper STRICTLY matched */}
      <div className="min-h-screen w-full bg-[#0A0E14] text-white overflow-x-hidden pb-24">
        <div className="px-4 pt-6 space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={barber?.avatarUrl || `https://ui-avatars.com/api/?name=${barber?.name || 'Vivaz'}&background=11AFFA&color=fff`} 
                alt="Avatar" 
                className="w-11 h-11 rounded-full object-cover border border-white/10" 
              />
              <div>
                <p className="text-[#8C97A8] text-xs">Você está na</p>
                <h2 className="text-white font-bold text-sm">{barber?.name || 'Barbearia Vivaz'}</h2>
              </div>
            </div>
            {/* 2. Cards match applied here as well */}
            <button className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-amber-400 rounded-full"></span>
            </button>
          </div>

          {/* Gamification Card - 2. Cards matched */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[#8C97A8] text-sm">Bem-vindo</p>
                <h2 className="text-white font-bold text-xl">{user?.name || 'Visitante'}</h2>
              </div>
              <div className="text-4xl drop-shadow-md">🎁</div>
            </div>
            <div className="mt-4 relative z-10 flex items-center gap-3">
               <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden">
                 <div className="bg-gradient-to-r from-amber-200 to-amber-500 w-[60%] h-full rounded-full"></div>
               </div>
            </div>
            <p className="text-[#8C97A8] text-[10px] mt-2">Faltam 2 cortes para você ganhar seu prêmio</p>
          </div>

          {/* Promotional Banner */}
          {barber?.bannerImageUrl ? (
            <div className="relative w-full h-40 rounded-3xl overflow-hidden cursor-pointer border border-white/10">
              <img 
                src={barber.bannerImageUrl} 
                className="absolute inset-0 w-full h-full object-cover" 
                alt="Promo" 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E14] to-[#0A0E14]/10"></div>
              <div className="absolute inset-0 p-6 flex flex-col justify-center">
                <span className="text-amber-400 font-bold text-sm tracking-widest uppercase mb-1 drop-shadow-md">Especial</span>
                <h3 className="text-2xl text-white font-bold mb-1">Promoção Exclusiva</h3>
                <p className="text-[#8C97A8] text-sm mb-4">Aproveite as ofertas do barbeiro</p>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-40 rounded-3xl overflow-hidden cursor-pointer border border-white/10">
              <img 
                src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=600&auto=format&fit=crop" 
                className="absolute inset-0 w-full h-full object-cover" 
                alt="Promo" 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E14] to-[#0A0E14]/10"></div>
              <div className="absolute inset-0 p-6 flex flex-col justify-center">
                <span className="text-amber-400 font-bold text-sm tracking-widest uppercase mb-1 drop-shadow-md">Especial</span>
                <h3 className="text-2xl text-white font-bold mb-1">Corte Premium</h3>
                <p className="text-[#8C97A8] text-sm mb-4">Ganhe <strong className="text-amber-400">20% OFF</strong></p>
                <button className="bg-gradient-to-r from-amber-200 to-amber-500 text-black font-semibold rounded-xl px-5 py-1.5 text-xs w-fit">
                  Agendar
                </button>
              </div>
            </div>
          )}

          {/* Stepper */}
          <div className="flex items-center justify-between px-1">
            <button 
              onClick={() => step > 1 && setStep(1)} 
              className={`flex-1 text-center py-2.5 rounded-full text-[11px] font-bold transition-all ${
                step >= 1 ? 'bg-gradient-to-r from-amber-200 to-amber-500 text-black' : 'bg-white/5 border border-white/10 text-[#8C97A8]'
              }`}
            >
              1. Escolha
            </button>
            <span className="text-white/30 mx-2 text-xs">⟶</span>
            <button 
              onClick={() => step > 2 && setStep(2)} 
              disabled={selectedServices.length === 0 && step === 1}
              className={`flex-1 text-center py-2.5 rounded-full text-[11px] font-bold transition-all ${
                step >= 2 ? 'bg-gradient-to-r from-amber-200 to-amber-500 text-black' : 'bg-white/5 border border-white/10 text-[#8C97A8]'
              }`}
            >
              2. Data&Hora
            </button>
            <span className="text-white/30 mx-2 text-xs">⟶</span>
            <button 
              className={`flex-1 text-center py-2.5 rounded-full text-[11px] font-bold transition-all ${
                step === 3 ? 'bg-gradient-to-r from-amber-200 to-amber-500 text-black' : 'bg-white/5 border border-white/10 text-[#8C97A8]'
              }`}
            >
              3. Confirmação
            </button>
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg">Escolha os serviços</h3>
              
              <div className="grid grid-cols-2 gap-3">
                {services
                  .filter((srv, index, self) => index === self.findIndex((t) => t.id === srv.id))
                  .map((srv, idx) => {
                    const isSelected = selectedServices.some((s) => s.id === srv.id)
                    const fallbackImages = [
                      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=300&auto=format&fit=crop',
                      'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=300&auto=format&fit=crop',
                      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=300&auto=format&fit=crop',
                      'https://images.unsplash.com/photo-1512496015851-a1cbf5c28266?q=80&w=300&auto=format&fit=crop',
                    ]
                    const imageUrl = srv.imageUrl || fallbackImages[idx % fallbackImages.length]
                    
                    return (
                      <div
                        key={srv.id}
                        className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden flex flex-col transition-all ${
                          isSelected ? 'ring-2 ring-amber-400' : ''
                        }`}
                      >
                        <div className="relative h-36">
                          <img src={imageUrl} alt={srv.name} className="w-full h-full object-cover" />
                          <div className="absolute top-2 left-2 bg-white/20 backdrop-blur-md rounded-lg px-2 py-1 flex items-center gap-1 text-white font-bold text-xs">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> 4.9
                          </div>
                          <div className="absolute top-2 right-2 text-white">
                            <Heart className="w-5 h-5" />
                          </div>
                        </div>
                        
                        <div className="p-4 flex-1 flex flex-col">
                          <h4 className="text-white font-bold text-[13px] leading-tight mb-1">{srv.name}</h4>
                          <p className="text-[#8C97A8] text-[10px] mb-4">Dura entre {srv.durationMin} mnts</p>
                          
                          <div className="mt-auto">
                            <button
                              onClick={() => toggleService(srv)}
                              className={`w-full text-black font-semibold rounded-xl py-2.5 text-xs transition-all ${
                                isSelected 
                                ? 'bg-white/20 text-white' 
                                : 'bg-gradient-to-r from-amber-200 to-amber-500'
                              }`}
                            >
                              {isSelected ? 'Remover' : 'Agendar'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>

              {selectedServices.length > 0 && (
                 <div className="pt-6">
                    <button 
                      onClick={() => setStep(2)}
                      className="w-full bg-gradient-to-r from-amber-200 to-amber-500 text-black font-semibold rounded-xl py-4 shadow-lg shadow-amber-500/20"
                    >
                      Prosseguir para Horários
                    </button>
                 </div>
              )}
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-white font-bold text-lg">Data & Horário</h3>
              
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {availableDates.map((item) => (
                  <button
                    key={item.iso}
                    onClick={() => {
                      setSelectedDate(item.iso)
                      setSelectedSlot(null)
                    }}
                    className={`flex-shrink-0 min-w-[70px] min-h-[70px] flex flex-col justify-center items-center p-2 rounded-2xl transition-all cursor-pointer ${
                      selectedDate === item.iso
                        ? 'bg-gradient-to-r from-amber-200 to-amber-500 text-black shadow-lg shadow-amber-500/20'
                        : 'bg-white/5 backdrop-blur-md border border-white/10 text-[#8C97A8]'
                    }`}
                  >
                    <span className={`block text-[10px] uppercase font-bold ${selectedDate === item.iso ? 'text-black' : 'text-white'}`}>{item.dayName}</span>
                    <span className={`block text-xl font-bold my-0.5 ${selectedDate === item.iso ? 'text-black' : 'text-white'}`}>{item.dayNum}</span>
                    <span className={`block text-[10px] uppercase ${selectedDate === item.iso ? 'text-black' : 'text-[#8C97A8]'}`}>{item.month}</span>
                  </button>
                ))}
              </div>

              {slotsLoading ? (
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-12 animate-pulse bg-white/5 backdrop-blur-md border border-white/10 rounded-xl" />
                  ))}
                </div>
              ) : slots.length === 0 || !slots.some(s => s.available) ? (
                <div className="p-6 text-center space-y-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl">
                   <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                   <h4 className="text-white font-bold text-lg">Agenda Esgotada</h4>
                   <p className="text-[#8C97A8] text-sm">Sem horários para este dia.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {slots.filter(slot => slot.available).map((slot) => {
                    const isSelected = selectedSlot?.startTime === slot.startTime
                    const timeStr = formatBrasiliaTime(slot.startTime)
                    return (
                      <button
                        key={slot.startTime}
                        onClick={() => setSelectedSlot(slot)}
                        className={`h-12 rounded-xl text-sm font-bold transition-all flex items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-200 to-amber-500 text-black shadow-lg shadow-amber-500/20'
                            : 'bg-white/5 backdrop-blur-md border border-white/10 text-white hover:border-amber-400 hover:bg-white/10'
                        }`}
                      >
                        {timeStr}
                      </button>
                    )
                  })}
                </div>
              )}

              {selectedSlot && (
                 <div className="pt-4">
                    <button 
                      onClick={() => setStep(3)}
                      className="w-full bg-gradient-to-r from-amber-200 to-amber-500 text-black font-semibold rounded-xl py-4 shadow-lg shadow-amber-500/20"
                    >
                      Ir para Confirmação
                    </button>
                 </div>
              )}
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <form className="space-y-6">
              <h3 className="text-white font-bold text-lg">Finalizar Agendamento</h3>
              
              {!user ? (
                <div className="p-6 space-y-4 text-center bg-white/5 backdrop-blur-md border border-white/10">
                  <div className="w-12 h-12 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-400/30">
                    <LogIn className="w-6 h-6" />
                  </div>
                  <h4 className="text-white font-bold text-base">Faça Login</h4>
                  <p className="text-[#8C97A8] text-sm">Entre para confirmar seu agendamento.</p>
                  
                  <div className="flex gap-3 pt-2">
                    <Link to={`/login?redirect=/${slug}`} className="flex-1">
                      <button type="button" className="w-full bg-white/5 backdrop-blur-md border border-white/10 text-white font-semibold rounded-xl py-3 text-sm">
                        Entrar
                      </button>
                    </Link>
                    <Link to={`/registro?redirect=/${slug}`} className="flex-1">
                      <button type="button" className="w-full bg-gradient-to-r from-amber-200 to-amber-500 text-black font-semibold rounded-xl py-3 text-sm">
                        Criar Conta
                      </button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-5 bg-white/5 backdrop-blur-md border border-white/10">
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col gap-2">
                    <span className="text-amber-400 font-semibold text-xs flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Conectado como {user.name}
                    </span>
                    <span className="text-white font-bold text-sm">Total: R$ {totalDuration}</span>
                  </div>

                  <div>
                    <label className="text-[#8C97A8] text-xs font-semibold block mb-1">Nome Completo</label>
                    <input
                      type="text" required value={clientName} onChange={e => setClientName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[#8C97A8] text-xs font-semibold block mb-1">WhatsApp</label>
                    <input
                      type="tel" required value={clientPhone} onChange={e => setClientPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  
                  <button 
                      type="button"
                      disabled={submitting}
                      onClick={handleConfirmAppointment}
                      className="w-full bg-gradient-to-r from-amber-200 to-amber-500 text-black font-semibold rounded-xl py-4 shadow-lg shadow-amber-500/20 flex justify-center mt-6"
                    >
                      {submitting ? <RefreshCw className="w-6 h-6 animate-spin text-black" /> : 'Confirmar Agendamento'}
                    </button>
                </div>
              )}
            </form>
          )}
        </div>
        
        {/* EXACT Bottom Navigation Bar as requested */}
        <ClientBottomNav 
          onActionClick={() => {
            // Smooth scroll up to the form
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      </div>
    </LocalErrorBoundary>
  )
}
