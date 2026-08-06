import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { useToastStore } from '@/stores/toast.store'
import type { ToastMessage } from '@/stores/toast.store'

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts)

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

function Toast({ toast }: { toast: ToastMessage }) {
  const removeToast = useToastStore((state) => state.removeToast)

  const config = {
    success: {
      icon: <CheckCircle className="w-5 h-5 text-[#2ED9A0]" />,
      borderColor: 'border-l-[#2ED9A0]',
    },
    error: {
      icon: <XCircle className="w-5 h-5 text-[#F87171]" />, // Coral/Red
      borderColor: 'border-l-[#F87171]',
    },
    info: {
      icon: <Info className="w-5 h-5 text-[#11AFFA]" />,
      borderColor: 'border-l-[#11AFFA]',
    },
  }

  const { icon, borderColor } = config[toast.type]

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 w-[320px] bg-figaro-black/90 backdrop-blur-md border border-white/10 ${borderColor} border-l-4 rounded-xl shadow-2xl animate-in slide-in-from-right-8 fade-in duration-300`}
    >
      <div className="shrink-0 mt-0.5">{icon}</div>
      
      <div className="flex-1 text-sm font-medium text-white/90 leading-tight">
        {toast.message}
      </div>

      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 text-white/40 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
