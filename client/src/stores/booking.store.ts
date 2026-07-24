import { create } from 'zustand'
import type { Service, User, TimeSlot } from '@/types'

interface BookingState {
  step: 1 | 2 | 3 | 4
  selectedServices: Service[]
  selectedBarber: User | null // null means "Sem preferência"
  selectedDate: string // YYYY-MM-DD
  selectedSlot: TimeSlot | null
  clientName: string
  clientPhone: string
  clientNotes: string
  payDeposit: boolean

  // Actions
  setStep: (step: 1 | 2 | 3 | 4) => void
  toggleService: (service: Service) => void
  setSelectedBarber: (barber: User | null) => void
  setSelectedDate: (date: string) => void
  setSelectedSlot: (slot: TimeSlot | null) => void
  setClientInfo: (info: { name?: string; phone?: string; notes?: string; payDeposit?: boolean }) => void
  resetBooking: () => void
}

export const useBookingStore = create<BookingState>((set) => ({
  step: 1,
  selectedServices: [],
  selectedBarber: null,
  selectedDate: new Date().toISOString().split('T')[0],
  selectedSlot: null,
  clientName: '',
  clientPhone: '',
  clientNotes: '',
  payDeposit: false,

  setStep: (step) => set({ step }),
  toggleService: (service) =>
    set((state) => {
      const exists = state.selectedServices.some((s) => s.id === service.id)
      return {
        selectedServices: exists
          ? state.selectedServices.filter((s) => s.id !== service.id)
          : [...state.selectedServices, service],
      }
    }),
  setSelectedBarber: (barber) => set({ selectedBarber: barber }),
  setSelectedDate: (date) => set({ selectedDate: date, selectedSlot: null }),
  setSelectedSlot: (slot) => set({ selectedSlot: slot }),
  setClientInfo: (info) =>
    set((state) => ({
      clientName: info.name !== undefined ? info.name : state.clientName,
      clientPhone: info.phone !== undefined ? info.phone : state.clientPhone,
      clientNotes: info.notes !== undefined ? info.notes : state.clientNotes,
      payDeposit: info.payDeposit !== undefined ? info.payDeposit : state.payDeposit,
    })),
  resetBooking: () =>
    set({
      step: 1,
      selectedServices: [],
      selectedBarber: null,
      selectedDate: new Date().toISOString().split('T')[0],
      selectedSlot: null,
      clientName: '',
      clientPhone: '',
      clientNotes: '',
      payDeposit: false,
    }),
}))

// Helper hooks/selectors to derive computed state cleanly
export function useBookingTotals() {
  const selectedServices = useBookingStore((s) => s.selectedServices)
  const totalPrice = selectedServices.reduce((acc, s) => acc + s.price, 0)
  const totalDuration = selectedServices.reduce((acc, s) => acc + s.durationMin, 0)

  return { totalPrice, totalDuration }
}
