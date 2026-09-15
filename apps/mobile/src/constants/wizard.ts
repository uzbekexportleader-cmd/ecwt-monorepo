/**
 * Profil sehrgari qadamlari — bitta ekran = bitta savol.
 * Tartib va matnlar shu yerda, ekran esa faqat chizadi.
 */
export type WizardStepId =
  | 'firstName'
  | 'lastName'
  | 'pinfl'
  | 'region'
  | 'district'
  | 'craft'
  | 'experience'
  | 'workshop'
  | 'membership'
  | 'business'
  | 'photos'
  | 'done';

export interface WizardStep {
  id: WizardStepId;
  question: string;
  hint?: string;
  /** Bu qadamni o'tkazib yuborish mumkinmi */
  optional?: boolean;
}

export const WIZARD_STEPS: WizardStep[] = [
  { id: 'firstName', question: 'Ismingiz nima?', hint: 'Pasportdagidek yozing' },
  { id: 'lastName', question: 'Familiyangiz nima?' },
  {
    id: 'pinfl',
    question: 'JShShIR raqamingiz',
    hint: 'Pasport yoki ID kartadagi 14 xonali raqam. Keyinroq ham kiritsangiz bo‘ladi.',
    optional: true,
  },
  { id: 'region', question: 'Qaysi viloyatda yashaysiz?' },
  { id: 'district', question: 'Qaysi tumanda?' },
  { id: 'craft', question: 'Qaysi hunar bilan shug‘ullanasiz?' },
  {
    id: 'experience',
    question: 'Necha yildan beri shu ish bilan shug‘ullanasiz?',
    optional: true,
  },
  { id: 'workshop', question: 'Ustaxonangiz bormi?', optional: true },
  { id: 'membership', question: '“Hunarmand” uyushmasi a’zosimisiz?', optional: true },
  { id: 'business', question: 'Tadbirkor sifatida ro‘yxatdan o‘tganmisiz?', optional: true },
  {
    id: 'photos',
    question: 'Mahsulotlaringiz rasmini qo‘shing',
    hint: 'Kamida 1 ta rasm bo‘lsa, imkoniyatlar ko‘proq ochiladi.',
    optional: true,
  },
  { id: 'done', question: 'Profilingiz tayyor' },
];

export const TOTAL_QUESTIONS = WIZARD_STEPS.length - 1;
