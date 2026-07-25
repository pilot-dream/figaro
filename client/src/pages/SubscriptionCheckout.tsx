import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchBarberBySlug, fetchSubscriptionPlans, createSubscription, fetchTakenMrrSlots } from '@/lib/api'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { useToastStore } from '@/stores/toast.store'
import { Crown, Calendar, CreditCard, Check, ChevronRight, ArrowLeft } from 'lucide-react'

type Step = 'PLAN' | 'SLOT' | 'PAYMENT' | 'SUCCESS'

export function SubscriptionCheckout() {
  const { barberSlug } = useParams()
  const navigate = useNavigate()
  
  const [step, setStep] = useState<Step>('PLAN')
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const [barber, setBarber] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [takenSlots, setTakenSlots] = useState<{ dayOfWeek: number, time: string }[]>([])
  
  useEffect(() => {
    if (barberSlug) {
      fetchBarberBySlug(barberSlug).then(data => {
        setBarber(data.barber)
        fetchTakenMrrSlots(data.barber.id).then(setTakenSlots).catch(console.error)
      }).catch(console.error)
      fetchSubscriptionPlans().then(setPlans).catch(console.error)
    }
  }, [barberSlug])

  const daysOfWeek = [
    { id: 1, label: 'Segunda-feira' },
    { id: 2, label: 'Terça-feira' },
    { id: 3, label: 'Quarta-feira' },
    { id: 4, label: 'Quinta-feira' },
    { id: 5, label: 'Sexta-feira' },
    { id: 6, label: 'Sábado' },
  ]

  const mockTimes = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00']

  const handlePayment = async () => {
    if (!barber || !selectedPlan || selectedDay === null || !selectedTime) return
    
    setIsProcessing(true)
    try {
      await createSubscription({
        barberId: barber.id,
        planId: selectedPlan.id,
        dayOfWeek: selectedDay,
        time: selectedTime
      })
      setStep('SUCCESS')
    } catch (err: any) {
      useToastStore.getState().addToast(err.message || 'Erro ao processar assinatura', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0E14] text-white p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => step === 'PLAN' ? navigate(`/${barberSlug}`) : setStep(step === 'PAYMENT' ? 'SLOT' : 'PLAN')} className="p-2 h-auto text-[#8C97A8] hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="w-6 h-6 text-[#11AFFA]" />
            Clube Fígaro
          </h1>
        </div>

        {/* Progress Bar */}
        {step !== 'SUCCESS' && (
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[#1A2332] rounded-full -z-10"></div>
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#11AFFA] rounded-full -z-10 transition-all duration-500"
              style={{ width: step === 'PLAN' ? '0%' : step === 'SLOT' ? '50%' : '100%' }}
            ></div>
            
            <div className={`flex flex-col items-center gap-2 ${step === 'PLAN' ? 'text-[#11AFFA]' : 'text-white'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'PLAN' ? 'bg-[#11AFFA] text-white shadow-[0_0_15px_rgba(17,175,250,0.4)]' : 'bg-[#11AFFA] text-white'}`}>1</div>
              <span className="text-xs font-medium">Plano</span>
            </div>
            <div className={`flex flex-col items-center gap-2 ${step === 'SLOT' ? 'text-[#11AFFA]' : step === 'PAYMENT' ? 'text-white' : 'text-[#8C97A8]'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'SLOT' ? 'bg-[#11AFFA] text-white shadow-[0_0_15px_rgba(17,175,250,0.4)]' : step === 'PAYMENT' ? 'bg-[#11AFFA] text-white' : 'bg-[#1A2332]'}`}>2</div>
              <span className="text-xs font-medium">Horário</span>
            </div>
            <div className={`flex flex-col items-center gap-2 ${step === 'PAYMENT' ? 'text-[#11AFFA]' : 'text-[#8C97A8]'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'PAYMENT' ? 'bg-[#11AFFA] text-white shadow-[0_0_15px_rgba(17,175,250,0.4)]' : 'bg-[#1A2332]'}`}>3</div>
              <span className="text-xs font-medium">Pagamento</span>
            </div>
          </div>
        )}

        {/* Step 1: PLAN */}
        {step === 'PLAN' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h2 className="text-xl font-bold mb-2">Escolha seu Plano VIP</h2>
              <p className="text-[#8C97A8]">Garanta seu horário cativo toda semana.</p>
            </div>

            {plans.length > 0 ? plans.map((plan: any) => (
              <GlassCard 
                key={plan.id}
                className={`p-6 border-2 transition-all cursor-pointer ${selectedPlan?.id === plan.id ? 'border-[#11AFFA] bg-[#11AFFA]/5 shadow-[0_0_20px_rgba(17,175,250,0.15)]' : 'border-[#1A2332]/50 hover:border-[#11AFFA]/30'}`}
                onClick={() => setSelectedPlan(plan)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-black text-white">{plan.name}</h3>
                    <p className="text-[#8C97A8]">{plan.cutsPerPeriod} Cortes por mês</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-[#2ED9A0]">R$ {plan.price.toFixed(2)}</span>
                    <span className="text-sm text-[#8C97A8]">/mês</span>
                  </div>
                </div>
                {plan.description && (
                  <p className="text-sm text-[#8C97A8] mb-6 italic">{plan.description}</p>
                )}
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-[#8C97A8]">
                    <Check className="w-4 h-4 text-[#11AFFA]" /> Horário cativo garantido
                  </li>
                  <li className="flex items-center gap-2 text-[#8C97A8]">
                    <Check className="w-4 h-4 text-[#11AFFA]" /> Prioridade na fila de espera
                  </li>
                </ul>
              </GlassCard>
            )) : (
              <p className="text-[#8C97A8] p-4 text-center">Nenhum plano ativo no momento.</p>
            )}

            <Button 
              disabled={!selectedPlan} 
              onClick={() => setStep('SLOT')}
              className="w-full bg-[#11AFFA] hover:bg-[#11AFFA]/90 text-white font-bold py-4 text-lg border-none shadow-[0_0_20px_rgba(17,175,250,0.3)] disabled:opacity-50 disabled:shadow-none"
            >
              Continuar <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: SLOT */}
        {step === 'SLOT' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
             <div>
              <h2 className="text-xl font-bold mb-2">Escolha seu Horário Cativo</h2>
              <p className="text-[#8C97A8]">Este será o seu horário sagrado toda semana.</p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-[#8C97A8]">Dia da Semana</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {daysOfWeek.map(day => (
                  <button
                    key={day.id}
                    onClick={() => setSelectedDay(day.id)}
                    className={`p-3 rounded-xl border font-medium transition-all ${
                      selectedDay === day.id 
                        ? 'border-[#11AFFA] bg-[#11AFFA]/10 text-white shadow-[0_0_15px_rgba(17,175,250,0.2)]' 
                        : 'border-[#1A2332] bg-[#0A0E14] text-[#8C97A8] hover:border-[#11AFFA]/40'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedDay !== null && (
              <div className="space-y-4 animate-in fade-in zoom-in-95">
                <h3 className="font-semibold text-[#8C97A8]">Horário</h3>
                <div className="grid grid-cols-4 gap-3">
                  {mockTimes.map(time => {
                    const isTaken = takenSlots.some(s => s.dayOfWeek === selectedDay && s.time === time)
                    return (
                      <button
                        key={time}
                        disabled={isTaken}
                        onClick={() => setSelectedTime(time)}
                        className={`p-3 rounded-xl border font-medium transition-all ${
                          isTaken
                            ? 'border-[#1A2332]/30 bg-[#1A2332]/20 text-[#8C97A8]/30 cursor-not-allowed line-through'
                            : selectedTime === time 
                              ? 'border-[#11AFFA] bg-[#11AFFA]/10 text-white shadow-[0_0_15px_rgba(17,175,250,0.2)]' 
                              : 'border-[#1A2332] bg-[#0A0E14] text-[#8C97A8] hover:border-[#11AFFA]/40'
                        }`}
                      >
                        {time}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <Button 
              disabled={!selectedDay || !selectedTime} 
              onClick={() => setStep('PAYMENT')}
              className="w-full bg-[#11AFFA] hover:bg-[#11AFFA]/90 text-white font-bold py-4 text-lg border-none shadow-[0_0_20px_rgba(17,175,250,0.3)] disabled:opacity-50 disabled:shadow-none mt-8"
            >
              Ir para Pagamento <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 3: PAYMENT */}
        {step === 'PAYMENT' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <GlassCard className="p-6 border-[#1A2332]/50 text-center mb-8">
              <h3 className="text-lg font-bold text-white mb-1">Resumo da Assinatura</h3>
              <p className="text-[#2ED9A0] font-black text-2xl mb-4">R$ {selectedPlan?.price?.toFixed(2) || '0.00'} <span className="text-sm text-[#8C97A8] font-normal">/mês</span></p>
              <div className="flex items-center justify-center gap-2 text-[#8C97A8]">
                <Calendar className="w-4 h-4" />
                <span>Toda {daysOfWeek.find(d => d.id === selectedDay)?.label} às {selectedTime}</span>
              </div>
            </GlassCard>

            <div className="space-y-4">
              <h3 className="font-semibold text-white">Método de Pagamento</h3>
              <GlassCard className="p-6 border-[#1A2332]/50 hover:border-[#11AFFA]/30 transition-all">
                <div className="flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#11AFFA]/10 flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-[#11AFFA]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg mb-2">À Combinar na Barbearia</h4>
                    <p className="text-sm text-[#8C97A8]">
                      O pagamento será acertado diretamente com o seu barbeiro presencialmente. Seu horário já ficará reservado!
                    </p>
                  </div>
                </div>
              </GlassCard>
            </div>

            <Button 
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-[#2ED9A0] hover:bg-[#2ED9A0]/90 text-[#0A0E14] font-bold py-4 text-lg border-none shadow-[0_0_20px_rgba(46,217,160,0.3)] disabled:opacity-50"
            >
              {isProcessing ? 'Processando...' : 'Assinar e Garantir Horário'}
            </Button>
          </div>
        )}

        {/* Step 4: SUCCESS */}
        {step === 'SUCCESS' && (
          <div className="text-center space-y-6 py-12 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-[#2ED9A0]/20 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-12 h-12 text-[#2ED9A0]" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white mb-2">Bem-vindo ao Clube!</h2>
              <p className="text-[#8C97A8] max-w-sm mx-auto">
                Sua reserva foi concluída. Acerte o pagamento diretamente com o barbeiro na sua próxima visita.
              </p>
            </div>
            
            <GlassCard className="p-6 max-w-sm mx-auto border-[#2ED9A0]/30 bg-[#2ED9A0]/5">
              <h3 className="font-bold text-white mb-2">Seu Horário Fixo:</h3>
              <p className="text-lg text-[#2ED9A0] font-medium">Toda {daysOfWeek.find(d => d.id === selectedDay)?.label}</p>
              <p className="text-2xl font-black text-white">{selectedTime}</p>
            </GlassCard>

            <Button 
              onClick={() => navigate(`/${barberSlug}`)}
              className="bg-transparent border border-[#1A2332] text-white hover:bg-[#1A2332]"
            >
              Voltar para a Barbearia
            </Button>
          </div>
        )}

      </div>
    </div>
  )
}
