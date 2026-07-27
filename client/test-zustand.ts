import { create } from 'zustand'

export const useToastStore = create((set) => ({
  toasts: [],
  addToast: () => {},
}))

console.log(typeof useToastStore.getState);
