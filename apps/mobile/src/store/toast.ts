import { create } from 'zustand';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  tone: ToastTone;
  text: string;
}

interface ToastState {
  toast: ToastItem | null;
  show: (text: string, tone?: ToastTone) => void;
  hide: () => void;
}

let counter = 0;

/**
 * Bitta joyda ko'rinadigan qisqa xabar (success / error).
 * Alert oynasi foydalanuvchini to'xtatib qo'yadi — muvaffaqiyat xabarlari uchun
 * yumshoqroq toast ishlatamiz, faqat tasdiq so'raladigan joyda Alert qoladi.
 */
export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  show: (text, tone = 'success') => set({ toast: { id: ++counter, tone, text } }),
  hide: () => set({ toast: null }),
}));

export function toastSuccess(text: string): void {
  useToastStore.getState().show(text, 'success');
}

export function toastError(text: string): void {
  useToastStore.getState().show(text, 'error');
}

export function toastInfo(text: string): void {
  useToastStore.getState().show(text, 'info');
}
