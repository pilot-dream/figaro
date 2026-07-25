import { create } from 'zustand'

interface ConfirmStore {
  isOpen: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  onConfirm: () => void
  onCancel: () => void
  requestConfirm: (options: { title?: string; message: string; confirmText?: string; cancelText?: string }) => Promise<boolean>
}

export const useConfirmStore = create<ConfirmStore>((set) => ({
  isOpen: false,
  title: 'Confirmação',
  message: '',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  onConfirm: () => {},
  onCancel: () => {},
  requestConfirm: (options) => {
    return new Promise((resolve) => {
      set({
        isOpen: true,
        title: options.title || 'Confirmação',
        message: options.message,
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        onConfirm: () => {
          set({ isOpen: false })
          resolve(true)
        },
        onCancel: () => {
          set({ isOpen: false })
          resolve(false)
        }
      })
    })
  }
}))
