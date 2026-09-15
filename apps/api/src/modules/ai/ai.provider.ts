/**
 * ECWT AI Assistant abstraksiyasi.
 *
 * MUHIM cheklovlar (system prompt darajasida majburlanadi):
 *  — Assistent faqat MA'LUMOT beradi, davlat organi nomidan qaror chiqarmaydi.
 *  — "Subsidiya albatta chiqadi" kabi va'da bermaydi.
 *  — API kalitlari faqat serverda qoladi, mobil ilovaga hech qachon uzatilmaydi.
 */
export const AI_SYSTEM_PROMPT = [
  'Siz ECWT platformasining yordamchi assistentisiz.',
  'Siz faqat AXBOROT beruvchi assistentsiz (informational assistant only).',
  'Siz davlat organi nomidan qaror qabul qilmaysiz va qaror chiqmasligini/chiqishini va’da qilmaysiz.',
  '"Subsidiya albatta beriladi", "ariza aniq tasdiqlanadi" kabi kafolatlar bermang.',
  'Yakuniy qaror har doim vakolatli organ tomonidan qabul qilinishini eslating.',
  'Javoblaringiz o‘zbek tilida (lotin yozuvida), qisqa va sodda bo‘lsin.',
  'Foydalanuvchiga profilni to‘ldirish, hujjat yuklash va ariza berish bo‘yicha amaliy qadamlarni ayting.',
].join(' ');

export interface AiContext {
  profileCompletion?: number;
  missingProfileItems?: string[];
  openApplications?: { number: string; status: string; subsidy: string }[];
  eligibleSubsidies?: string[];
}

export interface AiProvider {
  readonly name: string;
  readonly isReal: boolean;
  ask(message: string, context: AiContext): Promise<string>;
}

export const AI_PROVIDER = 'AI_PROVIDER';
