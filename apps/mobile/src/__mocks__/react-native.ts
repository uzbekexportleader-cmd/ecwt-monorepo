/**
 * Testlarda react-native'ning to'liq moduli kerak emas —
 * store va yordamchi funksiyalar faqat shu bir nechtasini ishlatadi.
 */
export const Platform = {
  OS: 'ios' as 'ios' | 'android' | 'web',
  select: <T,>(spec: { ios?: T; android?: T; web?: T; default?: T }): T | undefined =>
    spec.ios ?? spec.default,
};

/** Analitika ilova fonga o'tganini kuzatadi — testda hodisa kelmaydi */
export const AppState = {
  addEventListener: (): { remove: () => void } => ({ remove: () => {} }),
};

/**
 * `theme.ts` uslublarni shu orqali yaratadi. Testda uslublar tekshirilmaydi,
 * shuning uchun obyektning o'zini qaytarish yetarli.
 */
export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
  absoluteFill: {},
  flatten: (style: unknown): unknown => style,
};
